// src/services/nutritionService.js
import { supabase } from '../config/supabase';

class NutritionService {
  // Get nutrition logs for a specific date range
  static async getByDateRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: false })
      .order('log_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get nutrition logs for a specific date
  static async getByDate(userId, date) {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('log_time', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Create a new nutrition log
  static async create(nutritionData) {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert([nutritionData])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Update a nutrition log
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Delete a nutrition log
  static async delete(id) {
    const { error } = await supabase
      .from('nutrition_logs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Get daily nutrition summary
  static async getDailySummary(userId, date) {
    // Implementation depends on views/queries
  }
}

export default NutritionService;
