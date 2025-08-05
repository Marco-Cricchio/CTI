# API Endpoints Testing Guide - CyberForge Sentinel

## Prerequisites
1. PostgreSQL database running with connection configured in `.env`
2. Server running on `http://localhost:3001`

## Authentication Endpoints

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@cyberforge.com",
    "password": "securepassword123"
  }'
```

### Login User
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@cyberforge.com",
    "password": "securepassword123"
  }'
```

**Response:** Save the `accessToken` for the next requests.

## Indicators Endpoints (Protected - Requires JWT Token)

Replace `YOUR_JWT_TOKEN` with the token received from login.

### Create Indicator
```bash
curl -X POST http://localhost:3001/api/indicators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "value": "192.168.1.100",
    "type": "ip",
    "threat_level": "high"
  }'
```

### Get All Indicators
```bash
curl -X GET http://localhost:3001/api/indicators \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Specific Indicator
```bash
curl -X GET http://localhost:3001/api/indicators/INDICATOR_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete Indicator (Soft Delete)
```bash
curl -X DELETE http://localhost:3001/api/indicators/INDICATOR_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Sample Indicators for Testing

```bash
# Malicious IP
curl -X POST http://localhost:3001/api/indicators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "value": "203.0.113.42",
    "type": "ip",
    "threat_level": "critical"
  }'

# Suspicious Domain
curl -X POST http://localhost:3001/api/indicators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "value": "malicious-site.example.com",
    "type": "domain",
    "threat_level": "high"
  }'

# Phishing URL
curl -X POST http://localhost:3001/api/indicators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "value": "https://fake-bank.evil.com/login",
    "type": "url",
    "threat_level": "medium"
  }'

# Malware Hash
curl -X POST http://localhost:3001/api/indicators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "value": "d41d8cd98f00b204e9800998ecf8427e",
    "type": "file_hash",
    "threat_level": "critical"
  }'

# Suspicious Email
curl -X POST http://localhost:3001/api/indicators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "value": "attacker@suspicious.com",
    "type": "email",
    "threat_level": "low"
  }'
```