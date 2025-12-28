import jwt
import time

secret = "cNLf7jviOUrHMUjcyK4TBNVRXqHNAhYEokhFi/kbjUI="

# For anon key
payload_anon = {
    "role": "anon",
    "iss": "supabase",
    "iat": int(time.time()),
    "exp": 2000000000  # far future
}

anon_key = jwt.encode(payload_anon, secret, algorithm="HS256")
print("ANON_KEY:", anon_key)

# For service_role key
payload_service = {
    "role": "service_role",
    "iss": "supabase",
    "iat": int(time.time()),
    "exp": 2000000000
}

service_key = jwt.encode(payload_service, secret, algorithm="HS256")
print("SERVICE_ROLE_KEY:", service_key)