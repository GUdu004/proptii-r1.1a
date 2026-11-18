import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import {
  captureSignupCode,
  getStoredSignupCode,
  hasSentAttribution,
  markAttributionSent,
} from '../../utils/signupAttribution';

/**
 * Captures ?ref=<code> on any page, and after sign-in sends the stored code
 * (or none, meaning inbound) to the backend once per account per browser.
 * The backend is write-once, so repeat calls from other devices are harmless.
 */
export const SignupAttributionBridge = () => {
  const { search } = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const inFlight = useRef<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(search).get('ref');
    if (ref) captureSignupCode(ref);
  }, [search]);

  useEffect(() => {
    const uid = user?.id;
    if (isLoading || !isAuthenticated || !uid) return;
    if (hasSentAttribution(uid) || inFlight.current === uid) return;

    inFlight.current = uid;
    const code = getStoredSignupCode();
    apiService
      .post<{ success: boolean }>('/auth/attribution', code ? { code } : {})
      .then((res: any) => {
        const ok = res?.success !== false && res?.data?.success !== false;
        if (ok) markAttributionSent(uid);
      })
      .catch(() => {
        /* retried on next load */
      })
      .finally(() => {
        inFlight.current = null;
      });
  }, [isLoading, isAuthenticated, user?.id]);

  return null;
};
