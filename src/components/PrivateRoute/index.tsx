import { Navigate, useLocation } from "react-router-dom";
import { useTypedSelector } from "../../store/hooks";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isLoggedIn = useTypedSelector(({ user }) => user.isLoggedIn);
  const location = useLocation();
  const redirectTo = encodeURIComponent(
    `${location.pathname}${location.search}`,
  );

  return isLoggedIn ? (
    children
  ) : (
    <Navigate to={`/login?redirectTo=${redirectTo}`} />
  );
};

export default PrivateRoute;
