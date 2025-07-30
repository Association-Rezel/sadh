import { CircularProgress } from "@mui/material";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function AuthRedirect({
  basePath,
  params,
  customSuccessURI
}: {
  basePath: string;
  params?: Record<string, string>;
  customSuccessURI?: string;
}) {
  const location = useLocation();

  useEffect(() => {
    window.location.href = basePath + "?" + new URLSearchParams({
      ...params,
      success_uri: customSuccessURI || location.pathname + location.search
    }).toString();
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <CircularProgress />
    </div>
  );
};

export const AdminLoginRedirect = ({ customSuccessURI }: { customSuccessURI?: string }) => {
  return <AuthRedirect basePath={`/auth/login/admin`} customSuccessURI={customSuccessURI} />;
};

export const LoginRedirect = ({ customSuccessURI }: { customSuccessURI?: string }) => {
  return <AuthRedirect basePath={`/auth/login/user`} customSuccessURI={customSuccessURI} />;
};

export const SignupRedirect = ({ customSuccessURI }: { customSuccessURI?: string }) => {
  return <AuthRedirect basePath={`/auth/login/user`} params={{ prompt: "create"}} customSuccessURI={customSuccessURI} />;
};

