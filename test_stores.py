#!/usr/bin/env python3
import requests

# Get a token first
login_response = requests.post('http://localhost:3001/api/auth/login', json={
    'email': 'admin@pharmatrak.com',
    'password': 'Admin123!'
})

if login_response.status_code == 200:
    token = login_response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test the stores endpoint
    response = requests.get('http://localhost:3001/api/stores', headers=headers)
    print(f'Stores API status: {response.status_code}')
    if response.status_code != 200:
        print(f'Error: {response.text}')
    else:
        print('Success: API returned data')
        print(f'Response length: {len(response.text)} chars')
else:
    print('Login failed')