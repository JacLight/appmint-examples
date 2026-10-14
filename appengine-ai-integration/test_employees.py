import unittest
from employees import Employees,EmployeeWorker
class Mock:
    def __init__(self): self.calls=[]
    def request(self,*args,**kwargs): self.calls.append((args,kwargs));return {'allowed':False,'job':None,'reason':'Nothing in its queue.'}
class Tests(unittest.TestCase):
    def test_worker_does_not_complete_rejected_action(self):
        c=Mock();r=EmployeeWorker(c,'ava','runtime1').approval('work','One unchanged note');self.assertFalse(r['allowed']);self.assertEqual(len(c.calls),1)
    def test_assigned_task_uses_employee(self):
        c=Mock();Employees(c,'ava','team').assign_task('Check','Use exact done','ava@org.local');self.assertEqual(c.calls[0][0][2]['task']['assignTo'],['ava@org.local'])
    def test_shared_requires_mention(self):
        with self.assertRaises(ValueError): Employees(Mock(),'ava','team').say('hello',shared=True)
    def test_invalid_decision(self):
        with self.assertRaises(ValueError): Employees(Mock(),'ava').decide('id','maybe')
if __name__=='__main__':unittest.main()
