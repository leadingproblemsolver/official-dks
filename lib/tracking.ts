import { supabase } from './supabase';

export interface UsageStatus {
  canProceed: boolean;
  reason?: string;
  count: number;
}

export const checkUsage = async (): Promise<UsageStatus> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    const demoUsed = typeof window !== 'undefined' && localStorage.getItem('kill_switch_demo_used');
    if (demoUsed) {
      return { canProceed: false, reason: 'Sign up to continue (Demo Used)', count: 1 };
    }
    return { canProceed: true, count: 0 };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('usage_count')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { canProceed: true, count: 0 };
  }

  if (profile.usage_count >= 5) {
    return { canProceed: false, reason: 'Usage cap reached (5/5)', count: profile.usage_count };
  }

  return { canProceed: true, count: profile.usage_count };
};

export const logDecision = async (userId: string | 'demo', decisionData: any) => {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        ...decisionData,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;

    if (userId !== 'demo') {
      const { data: profile } = await supabase.from('profiles').select('usage_count').eq('id', userId).single();
      await supabase
        .from('profiles')
        .update({
          usage_count: (profile?.usage_count || 0) + 1,
          last_request_at: new Date().toISOString()
        })
        .eq('id', userId);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('kill_switch_demo_used', 'true');
      }
    }
    return data.id;
  } catch (error) {
    console.error('Error logging decision:', error);
    return null;
  }
};

export const logAppEvent = async (event: string, metadata: any = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('logs')
      .insert({
        user_id: user?.id || 'guest',
        event,
        metadata,
        timestamp: new Date().toISOString(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
      });
  } catch (error) {
    console.warn('Logging failed', error);
  }
};
