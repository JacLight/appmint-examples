import 'package:flutter/material.dart';

import 'phone_model.dart';

void main() => runApp(const PhoneApp());

class PhoneApp extends StatelessWidget {
  const PhoneApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'AppEngine Phone client',
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff7136e8)),
      useMaterial3: true,
    ),
    home: const PhoneScreen(),
  );
}

class PhoneScreen extends StatefulWidget {
  const PhoneScreen({super.key});
  @override
  State<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends State<PhoneScreen> {
  final model = PhoneModel();
  final destination = TextEditingController(text: '+12025550118');
  final message = TextEditingController(text: 'Your appointment is confirmed.');
  int tab = 0;
  @override
  void dispose() {
    model.dispose();
    destination.dispose();
    message.dispose();
    super.dispose();
  }

  void attempt(VoidCallback action) {
    try {
      action();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Widget panel(String title, List<Widget> children) => Card(
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    ),
  );
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: model,
    builder: (context, _) => Scaffold(
      appBar: AppBar(title: const Text('AppEngine Phone client')),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (v) => setState(() => tab = v),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.phone), label: 'Phone'),
          NavigationDestination(icon: Icon(Icons.sms), label: 'SMS'),
          NavigationDestination(icon: Icon(Icons.history), label: 'History'),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Card(
            color: Color(0xffffedbd),
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'SIMULATED PROVIDER • No carrier calls, microphone audio, SMS delivery or native push.',
              ),
            ),
          ),
          if (model.error != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(
                model.error!,
                style: const TextStyle(color: Colors.red),
              ),
            ),
          if (tab == 0) ...[
            panel('Connection', [
              Text(model.connection, key: const Key('connection-state')),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilledButton(
                    onPressed: model.registered || model.connecting
                        ? null
                        : model.connect,
                    child: const Text('Register installation'),
                  ),
                  OutlinedButton(
                    onPressed: model.registered && !model.ready
                        ? model.sdkRegistered
                        : null,
                    child: const Text('Simulate SDK ready'),
                  ),
                  TextButton(
                    onPressed: model.registered || model.connecting
                        ? model.disconnect
                        : null,
                    child: const Text('Disconnect'),
                  ),
                ],
              ),
            ]),
            panel('Call', [
              DropdownButtonFormField<String>(
                initialValue: model.selectedLine,
                decoration: const InputDecoration(
                  labelText: 'Assigned caller ID',
                ),
                items: model.assignedLines
                    .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                    .toList(),
                onChanged: model.call == CallState.idle
                    ? (v) => setState(() => model.selectedLine = v!)
                    : null,
              ),
              TextField(
                controller: destination,
                decoration: const InputDecoration(
                  labelText: 'Destination',
                  hintText: '+12025550118',
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              Text('Call: ${model.call.name}', key: const Key('call-state')),
              if (model.call != CallState.idle) Text(model.peer),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilledButton(
                    onPressed: model.ready && model.call == CallState.idle
                        ? () => attempt(() => model.dial(destination.text))
                        : null,
                    child: const Text('Dial'),
                  ),
                  if (model.call == CallState.dialing)
                    FilledButton(
                      onPressed: model.answer,
                      child: const Text('Simulate remote answer'),
                    ),
                  if (model.call == CallState.incoming)
                    FilledButton(
                      onPressed: model.answer,
                      child: const Text('Accept'),
                    ),
                  if (model.call == CallState.incoming)
                    OutlinedButton(
                      onPressed: () => model.end(reject: true),
                      child: const Text('Reject'),
                    ),
                  if (model.call != CallState.idle)
                    OutlinedButton(
                      onPressed: model.end,
                      child: const Text('Hang up'),
                    ),
                  if (model.call == CallState.connected)
                    OutlinedButton(
                      onPressed: model.toggleMute,
                      child: Text(model.muted ? 'Unmute' : 'Mute'),
                    ),
                ],
              ),
              if (model.call == CallState.connected) ...[
                Text('DTMF: ${model.digits}'),
                Wrap(
                  children: '123456789*0#'
                      .split('')
                      .map(
                        (v) => TextButton(
                          onPressed: () => model.dtmf(v),
                          child: Text(v),
                        ),
                      )
                      .toList(),
                ),
              ],
            ]),
            panel('Exercise provider events', [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(
                    onPressed: model.ready ? model.incoming : null,
                    child: const Text('Simulate incoming'),
                  ),
                  OutlinedButton(
                    onPressed: model.registered ? model.renew : null,
                    child: const Text('Simulate token expiry'),
                  ),
                  OutlinedButton(
                    onPressed: model.ready ? model.networkError : null,
                    child: const Text('Simulate network error'),
                  ),
                ],
              ),
            ]),
          ],
          if (tab == 1) ...[
            panel('Send a simulated SMS', [
              Text('From ${model.selectedLine}'),
              TextField(
                controller: destination,
                decoration: const InputDecoration(labelText: 'Recipient'),
              ),
              TextField(
                controller: message,
                decoration: const InputDecoration(labelText: 'Message'),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: model.sending
                    ? null
                    : () => model.send(destination.text, message.text),
                child: const Text('Send SMS'),
              ),
            ]),
            ...model.messages.map(
              (m) => panel('${m['id']} · ${m['status']}', [
                Text('${m['to']}'),
                Text('${m['text']}'),
                Wrap(
                  spacing: 8,
                  children: ['sent', 'delivered', 'undelivered']
                      .map(
                        (status) => TextButton(
                          onPressed: () => model.messageStatus(m, status),
                          child: Text('Simulate $status'),
                        ),
                      )
                      .toList(),
                ),
              ]),
            ),
          ],
          if (tab == 2)
            panel('Simulated call history', [
              if (model.calls.isEmpty) const Text('No calls yet.'),
              ...model.calls.map(
                (c) => ListTile(
                  title: Text(c['peer']!),
                  subtitle: Text('${c['line']} · ${c['status']}'),
                ),
              ),
            ]),
        ],
      ),
    ),
  );
}
