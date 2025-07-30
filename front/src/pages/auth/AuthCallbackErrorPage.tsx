import { useSearchParams } from 'react-router-dom';
import MenuBar from '../../components/Menus/MenuBar';

export default function AuthCallbackErrorPage() {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('error_message');

  const displayMessage = errorMessage || 'An unknown error occurred during the authentication process. Please try logging in again or contact support.';

  return (
    <>
      <MenuBar />
      <div className="container mx-auto mt-8">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">
            Authentication Problem
          </h1>

          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full" role="alert">
            <strong className="font-bold">Login Failed</strong>
            <span className="block sm:inline"> {displayMessage}</span>
          </div>
        </div>
      </div>
    </>
  );
}
