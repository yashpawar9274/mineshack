import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-6xl font-extrabold text-red-500 animate-pulse">
          404
        </h1>
        <p className="mb-6 text-lg text-gray-600">
          Oops! The page <span className="font-medium text-gray-800">{location.pathname}</span> does not exist.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="px-6 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
