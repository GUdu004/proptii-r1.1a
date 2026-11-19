import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { captureSignupCode } from '../utils/signupAttribution';

/**
 * /join/:code — per-channel and per-partner sign-up link.
 * Stores the code (first touch wins), then sends the visitor to landlord sign-up.
 */
const JoinPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  // Capture during render, before <Navigate> redirects. Safe to repeat: first touch wins.
  captureSignupCode(code);

  return <Navigate to="/signup?role=landlord" replace />;
};

export default JoinPage;
