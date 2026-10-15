import unittest
from phone_client import Phone
class Recorded(Phone):
 def __init__(self):self.calls=[]
 def request(self,*args,**kwargs):self.calls.append((args,kwargs));return {}
class Contracts(unittest.TestCase):
 def test_sms_query_and_payload(self):
  p=Recorded();p.send_sms('sender',['controlled'],'test');a,k=p.calls[0];self.assertEqual(k,{'query':{'send':'true'}});self.assertEqual(a[2]['data']['to'],['controlled'])
 def test_device_environment(self):
  p=Recorded()
  with self.assertRaises(ValueError):p.register('id','android',apns_environment='sandbox')
  self.assertEqual(p.calls,[])
 def test_read_history_has_no_write(self):
  p=Recorded();p.call_history(limit=2);self.assertEqual(p.calls[0],(('GET','/crm/communications/calls'),{'query':{'limit':2}}))
if __name__=='__main__':unittest.main()
