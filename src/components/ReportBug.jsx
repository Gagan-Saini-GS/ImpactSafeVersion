import React, { useEffect } from "react";

function ReportBug() {
  useEffect(() => {
    fetch("/getAccessToken", {
      method: "POST",
      body: JSON.stringify({
        userName: "Gagan",
        userEmail: "gagansaini@gmail.com",
        password: "gaganiscoder",
      }),
      headers: {
        "Content-type": "application;json charset=UTF-8",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        console.log(data.accessToken);
      });
  }, []);

  return (
    <div className="report-bug-box">
      <h1>
        Report Bug <i className="fas fa-bug"></i>
      </h1>
      <p>Write down issus that you face!</p>
      <textarea rows="10" cols="50" placeholder="Your issue..."></textarea>
      <button className="report-bug-save-btn">Submit</button>
    </div>
  );
}

export default ReportBug;
