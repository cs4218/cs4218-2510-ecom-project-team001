import React from "react";
import Layout from "./../components/Layout";

const About = () => {
  return (
    <Layout title={"About us - Ecommerce app"}>
      <div className="row about">
        <div className="col-md-6 ">
          <img
            src="/images/about.jpeg"
            alt="about"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <p className="text-justify mt-2">
            Add text
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;