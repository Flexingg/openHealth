// src/services/bodyMeasurementsService.js
import { supabase } from '../config/supabase';

class BodyMeasurementsService {
  // Get body measurements for a specific date range
  static async getByDateRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .gte('measurement_date', startDate)
      .lte('measurement_date', endDate)
      .order('measurement_date', { ascending: false })
      .order('measurement_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get latest measurements for each type
  static async getLatest(userId) {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })
      .order('measurement_time', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data[0];
  }

  // Create a new body measurement record
  static async create(measurementData) {
    const { data, error } = await supabase
      .from('body_measurements')
      .insert([measurementData])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Update a body measurement record
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('body_measurements')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Delete a body measurement record
  static async delete(id) {
    const { error } = await supabase
      .from('body_measurements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Get BMI statistics
  static async getBMIStats(userId, period = 'month') {
    // Implementation depends on views/queries
  }
}

export default BodyMeasurementsService;
