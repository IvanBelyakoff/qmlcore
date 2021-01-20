import os
import re
import xml.etree.ElementTree as ET
from xml.dom import minidom #beautify

tr_re = re.compile(r'\W(qsTr|qsTranslate|tr|QT_TR_NOOP|QT_TRANSLATE_NOOP)\s*\(\s*(.*?)\s*\)')
q1_re = re.compile(r'"(.*(?<!\\))"')
q2_re = re.compile(r'\'(.*(?<!\\))\'')

def scan(text, file = ''):
	locs = []
	for m in tr_re.finditer(text):
		type = m.group(1)
		args = m.group(2)
		m = q1_re.match(args) or q2_re.match(args)
		if m:
			locs.append((type, m.group(1), m.pos))
	return locs

class Location(object):
	def __init__(self, filename = None, line = None):
		self.filename = filename
		self.line = line

	def load(self, el):
		attr = el.attrib
		self.filename = attr['filename']
		self.line = attr['line']

	def save(self, parent):
		loc = ET.SubElement(parent, 'location')
		loc.attrib['filename'] = self.filename
		loc.attrib['line'] = str(self.line)

class Translation(object):
	def __init__(self, type = None, text = None):
		self.type = type
		self.text = None

	def load(self, el):
		self.type = el.attrib['type'] if 'type' in el else None
		self.text = el.text

	def save(self, parent):
		tr = ET.SubElement(parent, 'translation')
		if self.type is not None:
			tr.attrib['type'] = self.type
		tr.text = self.text if self.text is not None else ''

class Message(object):
	def __init__(self, loc = None, source = None, status = None, translation = Translation('unfinished')):
		self.location = loc
		self.source = source
		self.status = status
		self.translation = translation

	def load(self, el):
		for child in el:
			if child.tag == 'source':
				self.source = child.text
			elif child.tag == 'location':
				self.location = Location()
				self.location.load(child)
			elif child.tag == 'translation':
				self.translation = Translation()
				self.translation.load(child)

	def save(self, parent):
		msg = ET.SubElement(parent, 'message')
		if self.location is not None:
			self.location.save(msg)
		src = ET.SubElement(msg, 'source')
		src.text = self.source
		self.translation.save(msg)

class Context(object):
	def __init__(self, name = None):
		self.name = name
		self.__messages = {}

	def add(self, src, loc):
		if src in self.__messages:
			msg = self.__messages.get(src)
			assert msg.source == src
			if msg.status == 'obsoleted':
				msg.status = None #update status
		else:
			self.__messages[src] = Message(loc, src)

	def load(self, el):
		for child in el:
			if child.tag == 'message':
				msg = Message()
				msg.load(child)
				if msg.source is None:
					raise Exception('message without source')
				self.__messages[msg.source] = msg
			elif child.tag == 'name':
				self.name = child.text
		if self.name is None:
			raise Exception('context without name')

	def save(self, parent):
		ctx = ET.SubElement(parent, 'context')
		name = ET.SubElement(ctx, 'name')
		name.text = self.name
		for msg in self.__messages.itervalues():
			msg.save(ctx)

class Ts(object):
	def __init__(self, path = ''):
		self.__file = path
		if os.path.exists(path):
			self._load(path)
		self.__contexts = {}

	def _load(self, path):
		tree = ET.parse(path)
		for el in tree.getroot():
			if el.tag == 'context':
				context = Context()
				context.load(el)

	def save(self):
		root = ET.Element('TS')
		for ctx in self.__contexts.itervalues():
			ctx.save(root)

		rough_string = ET.tostring(root, 'utf-8')
		reparsed = minidom.parseString(rough_string)
		text = reparsed.toprettyxml(indent="  ")
		with open(self.__file + '.new', 'wb') as f:
			f.write(text)

	def scan_file(self, path, context):
		with open(path) as f:
			text = f.read()

		ctx = None
		for _type, source, pos in scan(text):
			if ctx is None:
				ctx = self.__contexts.setdefault(context, Context(context))
			line = 1 + text[0:pos].count('\n')
			ctx.add(source, Location(os.path.normpath(path), line))

	def scan(self, dirs):
		for directory in dirs:
			for dirpath, dirname, files in os.walk(directory):
				dirname[:] = filter(lambda name: name[0] != '.' and not name.startswith('qml2js'), dirname)

				for file in files:
					basename, ext = os.path.splitext(file)
					if ext == '.qml' or ext == '.js':
						path = os.path.join(dirpath, file)
						self.scan_file(path, basename)
