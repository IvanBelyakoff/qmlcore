dist:
		./qml-compiler -o app core controls tv
		java -jar compiler/gcc/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --externs compiler/gcc/jquery-1.9.js app/qml.js > app/qml.min.js

all:
		./qml-compiler -w -o app core controls tv

test-dev:
		./qml-compiler -w -o app core controls test
