// src/services/vitalsService.js
import { supabase } from '../config/supabase';

class VitalsService {
  // Get vitals records for a specific date range
  static async getByDateRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('vitals')
      .select('*')
      .eq('user_id', userId)
      .gte('record_date', startDate)
      .lte('record_date', endDate)
      .order('record_date', { ascending: false })
      .order('record_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get latest vitals record
  static async getLatest(userId) {
    const { data, error } = await supabase
      .from('vitals')
      .select('*')
      .eq('user_id', userId)
      .order('record_date', { ascending: false })
      .order('record_time', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data[0];
  }

  // Create a new vitals record
  static async create(vitalsData) {
    const { data, error } = await supabase
      .from('vitals')
      .insert([vitalsData])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Update a vitals record
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('vitals')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Delete a vitals record
  static async delete(id) {
    const { error } = await supabase
      .from('vitals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Get vitals trend analysis
  static async getVitalsTrends(userId, metric, period = 'month') {
    // Implementation depends on views/queries
  }
}

export default VitalsService;
