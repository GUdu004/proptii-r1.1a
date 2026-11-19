import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { captureSignupCode, resolveJoinLanding } from '../utils/signupAttribution';

/**
 * /join/:code — per-channel and per-partner sign-up link.
 * Stores the code (first touch wins), then sends the visitor to the channel's
 * landing page: the landlord homepage (/?audience=landlords) by default, or an allowlisted external page
 * (e.g. design partners go to the Design Partner invite page).
 */
const JoinPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  // Capture during render, before any redirect. Safe to repeat: first touch wins.
  captureSignupCode(code);
  const landing = resolveJoinLanding(code);
  const isExternal = /^https?:\/\//.test(landing);

  useEffect(() => {
    if (isExternal) window.location.replace(landing);
  }, [isExternal, landing]);

  if (isExternal) return null;
  return <Navigate to={landing} replace />;
};

export default JoinPage;
