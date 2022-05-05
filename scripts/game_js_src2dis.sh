#! /bin/bash

JS_PATH=/home/jonebigboy/myapp/game/static/js/
JS_PATH_SCR=${JS_PATH}src/
JS_PATH_DIS=${JS_PATH}dis/

find ${JS_PATH_SCR} -type f -name "*.js" | sort | xargs cat > ${JS_PATH_DIS}game.js

echo yes | python3 manage.py collectstatic


