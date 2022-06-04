#!/bin/bash

rm -f /tmp/test*.db /tmp/service*in /tmp/service_out /tmp/foo

./skdb --init /tmp/test.db

function establish_service() {
    echo "create stream $1 (a INTEGER);" | ./skdb --data /tmp/test.db
    echo "create virtual view $1_view as select * from $1;" | ./skdb --data /tmp/test.db
    echo "create stream $1_result (a INTEGER);" | ./skdb --data /tmp/test.db

    mkfifo /tmp/service_$1_in
    ./skdb --subscribe $1_view --data /tmp/test.db --updates /tmp/service_$1_in
    eval "$2" < /tmp/service_$1_in | ./skdb --data /tmp/test.db --load-csv $1_result &
}

establish_service "t1" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t2" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t3" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t4" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t5" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t6" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t7" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t8" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t9" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t10" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t11" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t12" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t13" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t14" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t15" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t16" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t17" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t18" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t19" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"
establish_service "t20" "egrep '[0-9]' | awk '{print (\$2 + 1)}'"


echo "SERVICE STARTED"
wait
