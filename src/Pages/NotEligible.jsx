import React from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

const NotEligible = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative">
      <div className="relative bg-gray-800 bg-opacity-90 p-8 rounded-xl shadow-lg max-w-lg text-center border border-gray-700">
        <div className="text-red-500 text-5xl mb-4 animate-ping items-center justify-center flex rounded-full w-16 h-16 mx-auto">
          <FaExclamationTriangle />
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-wide">
          Access Denied
        </h1>

        <p className="mb-4 text-gray-300 text-lg leading-relaxed">
          Sorry, you are not eligible to access this site as you are under 18.
        </p>

        <ul className="text-gray-400 mb-6 text-left space-y-2">
          <li className="flex items-center space-x-2">
            <span className="text-red-400">🚫</span>
            <span>This site is restricted to adults only.</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-yellow-400">📜</span>
            <span>You must be at least 18 years old to enter.</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-blue-400">🔒</span>
            <span>Access is denied as per our terms & conditions.</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-green-400">🔄</span>
            <span>You can return if you meet the required age criteria.</span>
          </li>
        </ul>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
          onClick={() => {navigate("/"), navigate(0)}}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotEligible;
