import React from 'react';
import { Container, Alert } from 'react-bootstrap';

const TestPage = () => {
  return (
    <Container className="py-5">
      <Alert variant="success">
        <Alert.Heading>
          <i className="fas fa-check-circle me-2"></i>
          Success! Development Route is Working
        </Alert.Heading>
        <p>If you can see this page, the development routing is working correctly.</p>
        <hr />
        <p className="mb-0">
          <strong>Current URL:</strong> {window.location.pathname}
          <br />
          <strong>Environment:</strong> {process.env.NODE_ENV}
        </p>
      </Alert>
      
      <div className="mt-4">
        <h3>Basic Component Test</h3>
        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-primary">Test Button 1</button>
          <button className="btn btn-success">Test Button 2</button>
          <button className="btn btn-danger">Test Button 3</button>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h5>Test Card</h5>
          </div>
          <div className="card-body">
            <p>This is a test card to verify components are rendering.</p>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Column 1</th>
                  <th>Column 2</th>
                  <th>Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Row 1, Col 1</td>
                  <td>Row 1, Col 2</td>
                  <td>Row 1, Col 3</td>
                </tr>
                <tr>
                  <td>Row 2, Col 1</td>
                  <td>Row 2, Col 2</td>
                  <td>Row 2, Col 3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default TestPage;