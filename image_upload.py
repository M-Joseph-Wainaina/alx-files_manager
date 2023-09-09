
import requests

r_json = {}
r_headers = {} 



r = requests.get("http://0.0.0.0:5000/stats", json=r_json, headers=r_headers)
print(r.__str__)
