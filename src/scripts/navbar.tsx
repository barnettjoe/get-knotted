import React from "react";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";

const NavBar: React.FC = ({ children }) => {
  return (
    <Navbar bg="light" expand="lg">
      <Navbar.Brand href="/">icovellavna</Navbar.Brand>
      <Nav>
        <Nav.Link href="/harness">perf harness</Nav.Link>
      </Nav>
      {children}
    </Navbar>
  );
};

export default NavBar;
