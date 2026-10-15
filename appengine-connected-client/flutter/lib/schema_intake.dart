import 'package:flutter/material.dart';

/// Deliberately bounded renderer for this course's configured intake schema.
/// Unknown controls stop the booking instead of silently dropping an answer.
class SchemaIntake extends StatelessWidget {
 const SchemaIntake({super.key,required this.schema,required this.answers,required this.onChanged});
 final Map<String,dynamic> schema,answers;
 final void Function(String,dynamic) onChanged;
 static String? validateValue(String name,Map<String,dynamic> field,dynamic value,List<dynamic> required){
  final missing=value==null||(value is String&&value.trim().isEmpty);
  if(missing)return required.contains(name)?'Complete ${field['title']??name}.':null;
  if(field.containsKey('const')&&value!=field['const'])return 'Confirm ${field['title']??name}.';
  if(field['enum'] is List && !(field['enum']as List).contains(value))return 'Choose a configured option.';
  if(field['type']=='boolean' && value is! bool)return 'Choose true or false.';
  if(field['type']=='string'){
   if(value is! String)return 'Enter text.';
   if(field['minLength']is num && value.length<field['minLength'])return 'Use at least ${field['minLength']} characters.';
   if(field['maxLength']is num && value.length>field['maxLength'])return 'Use at most ${field['maxLength']} characters.';
   if(field['pattern']is String && !RegExp(field['pattern']).hasMatch(value))return 'Use the requested format.';
  }
  if(field['type']=='integer'||field['type']=='number'){
   if(value is! num)return 'Enter a number.';
   if(field['type']=='integer'&&value%1!=0)return 'Enter a whole number.';
   if(field['minimum']is num&&value<field['minimum'])return 'Minimum ${field['minimum']}.';
   if(field['maximum']is num&&value>field['maximum'])return 'Maximum ${field['maximum']}.';
  }
  return null;
 }
 static List<String> unsupported(Map<String,dynamic> schema){
  // This is a bounded renderer, not a complete JSON Schema implementation.
  const schemaKeys={'type','title','description','properties','required',r'$schema',r'$id'};
  const fieldKeys={'type','title','description','enum','const','minLength','maxLength','pattern','minimum','maximum','x-control-variant'};
  final failures=<String>[];
  for(final key in schema.keys){if(!schemaKeys.contains(key))failures.add('schema.$key');}
  if(schema['type']!=null && schema['type']!='object')failures.add('schema.type');
  if(schema['properties'] is! Map){failures.add('schema.properties');return failures;}
  final properties=schema['properties']as Map;
  if(schema['required']!=null && schema['required'] is! List)failures.add('schema.required');
  for(final key in schema['required'] is List ? schema['required']as List : <dynamic>[]){if(key is! String || !properties.containsKey(key))failures.add('required:$key');}
  for(final e in properties.entries){
   if(e.value is! Map){failures.add('${e.key}');continue;}
   final f=e.value as Map;
   var unsupported=!['string','boolean','integer','number'].contains(f['type']) || f.keys.any((k)=>!fieldKeys.contains(k));
   if(f['x-control-variant']!=null && f['x-control-variant']!='textarea')unsupported=true;
   if(f['enum']!=null && f['enum'] is! List)unsupported=true;
   if(f['pattern']!=null){try{if(f['pattern'] is! String){unsupported=true;}else{RegExp(f['pattern']);}}catch(_){unsupported=true;}}
   if(unsupported)failures.add('${e.key}');
  }
  return failures;
 }
 @override Widget build(BuildContext context){
  final properties=schema['properties'] is Map ? schema['properties']as Map : <String,dynamic>{},required=schema['required'] is List ? schema['required']as List : <dynamic>[];
  final unsupportedFields=unsupported(schema);
  return Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
   Text('${schema['title']??'Booking details'}',style:Theme.of(context).textTheme.titleLarge),const SizedBox(height:8),
   if(unsupportedFields.isNotEmpty)Text('This client needs a renderer for: ${unsupportedFields.join(', ')}. Booking is disabled until these controls are implemented.'),
   ...properties.entries.where((e)=>!unsupportedFields.contains(e.key)).map((e){
    final name='${e.key}',f=Map<String,dynamic>.from(e.value),label='${f['title']??name}${required.contains(name)?' *':''}';
    String? validate(dynamic value)=>validateValue(name,f,value,required);
    Widget child;
    if(f['enum']is List){child=DropdownButtonFormField<dynamic>(isExpanded:true,key:Key('intake-$name'),initialValue:answers[name],decoration:InputDecoration(labelText:label,helperText:f['description']),items:(f['enum']as List).map((x)=>DropdownMenuItem(value:x,child:Text('$x'))).toList(),validator:validate,onChanged:(v)=>onChanged(name,v));}
    else if(f['type']=='boolean'){child=FormField<bool>(key:Key('intake-$name'),initialValue:answers[name]as bool? ?? false,validator:validate,builder:(state)=>Column(crossAxisAlignment:CrossAxisAlignment.start,children:[CheckboxListTile(contentPadding:EdgeInsets.zero,title:Text(label),value:state.value,onChanged:(v){state.didChange(v);onChanged(name,v);}),if(state.hasError)Text(state.errorText!,style:TextStyle(color:Theme.of(context).colorScheme.error))]));}
    else{dynamic parse(String v)=>['integer','number'].contains(f['type'])?(v.trim().isEmpty?null:(num.tryParse(v)??v)):v;child=TextFormField(key:Key('intake-$name'),initialValue:answers[name]?.toString(),decoration:InputDecoration(labelText:label,helperText:f['description']),minLines:f['x-control-variant']=='textarea'?3:1,maxLines:f['x-control-variant']=='textarea'?5:1,keyboardType:['integer','number'].contains(f['type'])?TextInputType.number:TextInputType.text,validator:(v)=>validate(parse(v??'')),onChanged:(v)=>onChanged(name,parse(v)));}
    return Padding(padding:const EdgeInsets.symmetric(vertical:10),child:child);
   }),
  ]);
 }
}
