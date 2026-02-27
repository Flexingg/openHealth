// src/services/cycleTrackingService.js
import { supabase } from '../config/supabase';

class CycleTrackingService {
  // Get cycle tracking records for a specific date range
  static async getByDateRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('cycle_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('record_date', startDate)
      .lte('record_date', endDate)
      .order('record_date', { ascending: false })
      .order('record_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get latest cycle tracking record
  static async getLatest(userId) {
    const { data, error } = await supabase
      .from('cycle_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('record_date', { ascending: false })
      .order('record_time', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data[0];
  }

  // Create a new cycle tracking record
  static async create(cycleData) {
    const { data, error } = await supabase
      .from('cycle_tracking')
      .insert([cycleData])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Update a cycle tracking record
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('cycle_tracking')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Delete a cycle tracking record
  static async delete(id) {
    const { error } = await supabase
      .from('cycle_tracking')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Get cycle prediction based on historical data
  static async getCyclePrediction(userId) {
    // Implementation depends on data patterns
  }
}

export default CycleTrackingService;
