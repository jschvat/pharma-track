#!/usr/bin/env python3
import requests

# First get a token
login_response = requests.post('http://localhost:3001/api/auth/login', json={
    'email': 'admin@pharmatrak.com',
    'password': 'Admin123!'
})

if login_response.status_code == 200:
    token = login_response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test various endpoints
    endpoints = [
        '/api/inventory/store/1/stats',
        '/api/inventory/store/1/low-stock',
        '/api/inventory/store/1/expiring', 
        '/api/audit/store/1',
        '/api/drugs/stats/overview',
        '/api/stores/stats',
        '/api/audit/recent'
    ]
    
    for endpoint in endpoints:
        response = requests.get(f'http://localhost:3001{endpoint}', headers=headers)
        print(f'{endpoint}: {response.status_code}')
        if response.status_code != 200:
            print(f'  Error: {response.text}')
else:
    print('Login failed:', login_response.text)