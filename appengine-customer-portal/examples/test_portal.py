import unittest
from portal import Portal,PortalError
class Fake(Portal):
 def __init__(self): super().__init__('https://example.invalid','org','old');self.calls=[];self.fail=False
 def call(self,method,path,body=None,query=None):
  self.calls.append((method,path,body,query))
  if self.fail: raise PortalError(404,{'error':'Not found'})
  if path=='/profile/customer/shared-account': return {'token':'new','refreshToken':'new-refresh','customer':{}}
  return {'sk':'owned','data':{'customer':{'email':'test+one@training.local'},'name':'B42','reservationDefinitionId':'definition','service':'Assessment'}}
class Contract(unittest.TestCase):
 def test_ownership_gate(self):
  p=Fake();p.fail=True
  with self.assertRaises(PortalError):p.cancel('other')
  self.assertEqual(len(p.calls),1)
 def test_cancel_identity_from_read(self):
  p=Fake();p.cancel('owned');self.assertEqual(p.calls[1][1],'/crm/reservations/cancel/test%2Bone%40training.local/B42')
 def test_availability(self):
  p=Fake();p.availability('owned','2026-11-06');self.assertEqual(p.calls[1][2]['excludeReservationId'],'owned')
 def test_replacement_session(self):
  p=Fake();saved=[];p.save_session=saved.append;p.switch_account('company');self.assertEqual(p.token,'new');self.assertEqual(saved[0]['refreshToken'],'new-refresh')
if __name__=='__main__':unittest.main()
