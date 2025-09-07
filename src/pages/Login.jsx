import React from 'react';
import { User as UserEntity } from "@/api/entities";

export default function LoginPage() {
  const handleLogin = () => {
    UserEntity.loginWithRedirect("/");
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-sky-700">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Timesheet</h1>
        <button
          onClick={handleLogin}
          className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-200 transition-all duration-200"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}
