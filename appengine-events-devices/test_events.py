import unittest
from events import Venue
class Fake:
    def __init__(self):self.calls=[]
    def request(self,*args):self.calls.append(args);return {'success':False,'reason':'Already inside'} if len(self.calls)==1 else {'currentOccupancy':1}
class ContractTests(unittest.TestCase):
    def test_denial_is_not_converted_into_admission(self):
        c=Fake();result=Venue(c,'event','hall','gate').admit('ticket');self.assertFalse(result['decision']['success']);self.assertEqual([r[1] for r in c.calls],['/events/checkin','/events/event/occupancy'])
    def test_preview_does_not_redeem(self):
        c=Fake();Venue(c,'event','hall','gate','counter').benefit('ticket');self.assertEqual(c.calls[0][2]['redeem'],False);self.assertEqual(c.calls[0][2]['checkpoint'],'counter')
    def test_saved_decision_survives_read_failure(self):
        class BrokenRead:
            def __init__(self):self.writes=0
            def request(self,method,*args):
                if method=='GET':raise OSError('count unavailable')
                self.writes+=1;return {'success':True}
        c=BrokenRead();r=Venue(c,'event','hall','gate').admit('ticket');self.assertTrue(r['decision']['success']);self.assertIsNone(r['occupancy']);self.assertEqual(c.writes,1)
    def test_missing_benefit_point_does_not_call_server(self):
        c=Fake()
        with self.assertRaises(ValueError):Venue(c,'event','hall','gate').benefit('ticket')
        self.assertEqual(c.calls,[])
    def test_credential_entrance_is_selected_explicitly(self):
        c=Fake();Venue(c,'event','hall','gate',credential_entrance='wristband-gate').admit_credential('band');self.assertEqual(c.calls[0][2]['checkpoint'],'wristband-gate')
if __name__=='__main__':unittest.main()
