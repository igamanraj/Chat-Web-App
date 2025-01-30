import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import NotEligible from "./Pages/NotEligible";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/not-eligible" element={<NotEligible />} />
      </Routes>
    </Router>
  );
};

export default App;
