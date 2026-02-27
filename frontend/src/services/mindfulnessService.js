// src/services/mindfulnessService.js
import { supabase } from '../config/supabase';

class MindfulnessService {
  // Get mindfulness sessions for a specific date range
  static async getByDateRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get latest mindfulness session
  static async getLatest(userId) {
    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data[0];
  }

  // Create a new mindfulness session
  static async create(sessionData) {
    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .insert([sessionData])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Update a mindfulness session
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Delete a mindfulness session
  static async delete(id) {
    const { error } = await supabase
      .from('mindfulness_sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Get session duration statistics
  static async getDurationStats(userId, period = 'month') {
    // Implementation depends on views/queries
  }
}

export default MindfulnessService;
