#!/bin/bash

# 1,Customer#000000001,"IVhzIApeRb ot,c,E",15,25-989-741-2988,711.56,BUILDING,"to the even, regular platelets. regular, ironic epitaphs nag e"

rm -f /tmp/test.db

skdb --init /tmp/test.db

echo "
CREATE TABLE CUSTOMER (
  c_custkey    INTEGER PRIMARY KEY,
  c_name       TEXT,
  c_address    TEXT,
  c_nationkey  INTEGER,
  c_phone      TEXT,
  c_acctbal    FLOAT,
  c_mktsegment TEXT,
  c_comment    TEXT
);
" | skdb --data /tmp/test.db

echo "
CREATE TABLE ORDERS (
  o_orderkey      INTEGER PRIMARY KEY,
  o_custkey       INTEGER,
  o_orderstatus   TEXT,
  o_totalprice    FLOAT,
  o_orderdate     TEXT,
  o_orderpriority TEXT,
  o_clerk         TEXT,
  o_shippriority  INTEGER,
  o_comment       TEXT
);
" | skdb --data /tmp/test.db

cat customer.csv | skdb --load-csv CUSTOMER --data /tmp/test.db 
cat orders.csv | skdb --load-csv ORDERS --data /tmp/test.db 


