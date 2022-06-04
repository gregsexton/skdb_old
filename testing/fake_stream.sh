#!/bin/bash

if [ -f /tmp/firstMillion.txt ];
then 
    echo "file firstMillion.txt exists"
else
    for j in {1..1000000}; do echo $j; done > /tmp/firstMillion.txt
fi

time (for i in {1..20}; do cat /tmp/firstMillion.txt | skdb --data /tmp/test.db --load-csv t$i & done; wait)
