const DoctorSlot = require('../models/DoctorSlot');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

/**
 * Slot Management Service - Doctor availability and slot management
 * Allows doctors to create, block, unblock, and manage their time slots
 */
class SlotManagementService {

  /**
   * Get doctor's slots for a specific date or date range
   */
  async getDoctorSlots(doctorId, startDate, endDate, requestInfo) {
    try {
      // Validate doctor exists
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.role !== 'doctor') {
        throw new Error('Doctor not found');
      }

      // If only startDate provided, get slots for that day
      if (!endDate) {
        endDate = startDate;
      }

      const slots = await DoctorSlot.getDoctorAvailability(doctorId, startDate, endDate);

      // Log slot access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_SCHEDULE',
        resourceType: 'DoctorSlot',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: `Viewed slots for date range ${startDate} to ${endDate}`,
        metadata: { 
          slotCount: slots.length,
          dateRange: { startDate, endDate }
        }
      });

      return {
        success: true,
        data: {
          doctor: {
            name: `${doctor.firstName} ${doctor.lastName}`,
            specialization: doctor.specialization
          },
          slots: slots,
          summary: this._generateSlotSummary(slots)
        },
        message: 'Doctor slots retrieved successfully'
      };

    } catch (error) {
      throw new Error(`Failed to retrieve doctor slots: ${error.message}`);
    }
  }

  /**
   * Create new time slots for doctor
   */
  async createSlots(doctorId, slotData, requestInfo) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();

      // Validate doctor
      const doctor = await User.findById(doctorId).session(session);
      if (!doctor || doctor.role !== 'doctor') {
        throw new Error('Doctor not found');
      }

      // Check for conflicts
      const conflicts = await DoctorSlot.checkConflicts(
        doctorId,
        slotData.date,
        slotData.startTime,
        slotData.endTime
      );

      if (conflicts.length > 0) {
        throw new Error('Time slot conflicts with existing slots');
      }

      let createdSlots = [];

      // Handle recurring slots
      if (slotData.isRecurring && slotData.recurringPattern) {
        createdSlots = await DoctorSlot.createRecurringSlots(
          doctorId,
          slotData,
          slotData.recurringPattern
        );
      } else {
        // Create single slot
        const slot = new DoctorSlot({
          doctor: doctorId,
          date: new Date(slotData.date),
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          duration: slotData.duration,
          slotType: slotData.slotType || 'REGULAR',
          instructions: slotData.instructions,
          location: slotData.location,
          maxPatients: slotData.maxPatients || 1,
          createdBy: doctorId
        });

        await slot.save({ session });
        createdSlots = [slot];
      }

      // Log slot creation
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'CREATE_SLOTS',
        resourceType: 'DoctorSlot',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        changes: {
          after: slotData,
          fieldsChanged: Object.keys(slotData)
        },
        description: `Created ${createdSlots.length} time slot(s)`,
        metadata: { 
          slotCount: createdSlots.length,
          isRecurring: slotData.isRecurring || false
        }
      });

      await session.commitTransaction();

      return {
        success: true,
        data: createdSlots,
        message: `Successfully created ${createdSlots.length} slot(s)`
      };

    } catch (error) {
      await session.abortTransaction();
      
      // Log failed creation
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'CREATE_SLOTS',
        resourceType: 'DoctorSlot',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        status: 'FAILURE',
        errorMessage: error.message,
        description: `Failed to create slots`
      });

      throw new Error(`Failed to create slots: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Block specific time slots (doctor unavailable)
   */
  async blockSlots(doctorId, slotIds, blockingData, requestInfo) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();

      const blockedSlots = [];
      const errors = [];

      for (const slotId of slotIds) {
        try {
          const slot = await DoctorSlot.findById(slotId).session(session);
          
          if (!slot) {
            errors.push({ slotId, error: 'Slot not found' });
            continue;
          }

          // Verify doctor owns this slot
          if (slot.doctor.toString() !== doctorId.toString()) {
            errors.push({ slotId, error: 'Unauthorized: Not your slot' });
            continue;
          }

          // Block the slot
          await slot.blockSlot(
            blockingData.reason,
            blockingData.description,
            doctorId
          );

          blockedSlots.push(slot);

        } catch (slotError) {
          errors.push({ slotId, error: slotError.message });
        }
      }

      // Log slot blocking
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'BLOCK_SLOTS',
        resourceType: 'DoctorSlot',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        changes: {
          after: blockingData,
          fieldsChanged: ['status', 'blockingInfo']
        },
        description: `Blocked ${blockedSlots.length} slot(s). Reason: ${blockingData.reason}`,
        metadata: { 
          blockedCount: blockedSlots.length,
          errorCount: errors.length,
          reason: blockingData.reason
        }
      });

      await session.commitTransaction();

      return {
        success: true,
        data: {
          blockedSlots,
          errors: errors.length > 0 ? errors : undefined
        },
        message: `Successfully blocked ${blockedSlots.length} slot(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`
      };

    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Failed to block slots: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Unblock previously blocked slots
   */
  async unblockSlots(doctorId, slotIds, requestInfo) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();

      const unblockedSlots = [];
      const errors = [];

      for (const slotId of slotIds) {
        try {
          const slot = await DoctorSlot.findById(slotId).session(session);
          
          if (!slot) {
            errors.push({ slotId, error: 'Slot not found' });
            continue;
          }

          // Verify doctor owns this slot
          if (slot.doctor.toString() !== doctorId.toString()) {
            errors.push({ slotId, error: 'Unauthorized: Not your slot' });
            continue;
          }

          // Unblock the slot
          await slot.unblockSlot();
          unblockedSlots.push(slot);

        } catch (slotError) {
          errors.push({ slotId, error: slotError.message });
        }
      }

      // Log slot unblocking
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'UNBLOCK_SLOTS',
        resourceType: 'DoctorSlot',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        changes: {
          after: { status: 'AVAILABLE' },
          fieldsChanged: ['status', 'blockingInfo']
        },
        description: `Unblocked ${unblockedSlots.length} slot(s)`,
        metadata: { 
          unblockedCount: unblockedSlots.length,
          errorCount: errors.length
        }
      });

      await session.commitTransaction();

      return {
        success: true,
        data: {
          unblockedSlots,
          errors: errors.length > 0 ? errors : undefined
        },
        message: `Successfully unblocked ${unblockedSlots.length} slot(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`
      };

    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Failed to unblock slots: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get available slots for patient booking (public view)
   */
  async getAvailableSlots(doctorId, date) {
    try {
      const availableSlots = await DoctorSlot.getAvailableSlots(doctorId, date);
      
      return {
        success: true,
        data: availableSlots.map(slot => ({
          _id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          slotType: slot.slotType,
          maxPatients: slot.maxPatients,
          currentBookings: slot.currentBookings,
          availableSpots: slot.maxPatients - slot.currentBookings
        })),
        message: `Found ${availableSlots.length} available slot(s)`
      };

    } catch (error) {
      throw new Error(`Failed to get available slots: ${error.message}`);
    }
  }

  /**
   * Get today's schedule summary for doctor
   */
  async getTodaySchedule(doctorId, requestInfo) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaySlots = await DoctorSlot.find({
        doctor: doctorId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .populate('appointment', 'patient appointmentType status')
      .populate('appointment.patient', 'firstName lastName digitalHealthCardId')
      .sort({ startTime: 1 });

      // Log today's schedule access
      await AuditLog.createLog({
        userId: doctorId,
        userRole: 'doctor',
        action: 'VIEW_TODAY_SCHEDULE',
        resourceType: 'DoctorSlot',
        resourceId: doctorId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        description: `Viewed today's schedule`,
        metadata: { 
          totalSlots: todaySlots.length,
          date: today.toISOString().split('T')[0]
        }
      });

      return {
        success: true,
        data: {
          date: today,
          slots: todaySlots,
          summary: {
            total: todaySlots.length,
            available: todaySlots.filter(s => s.status === 'AVAILABLE').length,
            booked: todaySlots.filter(s => s.status === 'BOOKED').length,
            blocked: todaySlots.filter(s => s.status === 'BLOCKED').length,
            completed: todaySlots.filter(s => s.status === 'COMPLETED').length
          }
        },
        message: "Today's schedule retrieved successfully"
      };

    } catch (error) {
      throw new Error(`Failed to get today's schedule: ${error.message}`);
    }
  }

  /**
   * Quick block slots for emergency/urgent situations
   */
  async quickBlockSlots(doctorId, blockData, requestInfo) {
    try {
      const { date, startTime, endTime, reason, description } = blockData;
      
      // Find all slots in the time range
      const slotsToBlock = await DoctorSlot.find({
        doctor: doctorId,
        date: new Date(date),
        status: 'AVAILABLE',
        $or: [
          {
            $and: [
              { startTime: { $gte: startTime } },
              { startTime: { $lt: endTime } }
            ]
          },
          {
            $and: [
              { endTime: { $gt: startTime } },
              { endTime: { $lte: endTime } }
            ]
          }
        ]
      });

      const slotIds = slotsToBlock.map(slot => slot._id);
      
      return await this.blockSlots(doctorId, slotIds, { reason, description }, requestInfo);

    } catch (error) {
      throw new Error(`Failed to quick block slots: ${error.message}`);
    }
  }

  /**
   * Generate slot summary statistics
   * @private
   */
  _generateSlotSummary(slots) {
    const summary = {
      total: slots.length,
      available: 0,
      booked: 0,
      blocked: 0,
      completed: 0,
      byType: {},
      byDate: {}
    };

    slots.forEach(slot => {
      // Count by status
      summary[slot.status.toLowerCase()]++;
      
      // Count by type
      summary.byType[slot.slotType] = (summary.byType[slot.slotType] || 0) + 1;
      
      // Count by date
      const dateStr = slot.date.toISOString().split('T')[0];
      summary.byDate[dateStr] = (summary.byDate[dateStr] || 0) + 1;
    });

    return summary;
  }
}

module.exports = new SlotManagementService();
