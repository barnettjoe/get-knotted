import React, { useEffect, useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import ReactDOM from "react-dom";
import Drawing from "./drawing";
import { Mode } from "./types";
import { setup as setupWasm } from "./wasm-interface";

let drawing: Drawing;

function changeDrawingMode(newMode: Mode) {
  drawing.mode = newMode;
}
async function doSetup() {
  await setupWasm();
  drawing = new Drawing();
}

function App() {
  const [offsetContour, setOffsetContour] = useState(false);
  useEffect(() => {
    doSetup();
  }, []);
  useEffect(() => {
    if (drawing) {
      drawing.options.set({ offsetContour });
    }
  }, [offsetContour]);
  return (
    <>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">icovellavna</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#link">Link</Nav.Link>
            <NavDropdown title="mode" id="basic-nav-dropdown">
              <NavDropdown.Item onClick={() => changeDrawingMode("add-grid")}>
                add grid
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => changeDrawingMode("add-node")}>
                add node
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => changeDrawingMode("add-line")}>
                add line
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">
                Separated link
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Form inline>
            <Form.Label>
              offset&nbsp;
              <Form.Check
                inline
                type="checkbox"
                onChange={(evt) => {
                  setOffsetContour(evt.target.checked);
                }}
              />
            </Form.Label>
            <FormControl
              type="text"
              placeholder="Search knots"
              className="mr-sm-2"
            />
            <Button variant="outline-success">Search</Button>
          </Form>
        </Navbar.Collapse>
      </Navbar>
      <canvas id="webgl-surface"></canvas>
    </>
  );
}

const root = document.getElementById("root");
if (root === null) {
  throw new Error("could not find root element for react");
}

ReactDOM.render(<App />, root);
