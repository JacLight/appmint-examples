import os,json
from employees import Client,Employees
with open(os.environ['AI_FIXTURE']) as stream: fixture=json.load(stream)
api=Client(os.environ['APPMINT_URL'],os.environ['APPMINT_ORG'],os.environ['STAFF_TOKEN'])
print(json.dumps(Employees(api,fixture['name']).detail(),indent=2))
