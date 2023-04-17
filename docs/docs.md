# 

## Download

A free version of skdb is available for non-commercial use ([license](./license.pdf)).
You can download it here:
[https://github.com/SkipLabs/skdb/raw/main/bin/skdb-linux-x64-0.9.bin](https://github.com/SkipLabs/skdb/raw/main/bin/skdb-linux-x64-0.9.bin)

For commercial use, please contact us at [contact@skiplabs.io](mailto:contact@skiplabs.io).

## Linux

SKDB is only available for x64-Linux.
If you don't have linux on your machine, you can install [docker](https://docs.docker.com/get-docker/).
Although SKDB runs on most versions of Linux, SkipLabs will only maintain a version running on the latest [ubuntu LTS](https://wiki.ubuntu.com/Releases).
We highly recommend you use that version,
but if you need to run skdb on a different platform, please contact us at [contact@skiplabs.io](mailto:contact@skiplabs.io).

## SQL

This documentation is not a good place to learn SQL. If you need to get started you can find a good introduction here: [https://www.w3schools.com/sql/](https://www.w3schools.com/sql/).
The subset of SQL implemented by SKDB is the same as SQLite, you can find it here: [https://www.sqlite.org/lang.html](https://www.sqlite.org/lang.html). The API to access SKDB is command-line based for now. If you need a driver please contact us at: [contact@skiplabs.io](mailto:contact@skiplabs.io).

## Install

First, install the binary file (preferably in '/usr/local/bin'). Make sure you don't rename the original binary, because
some SKDB updates will require you to export your data to a newer version of the database. So it is safer to keep all
the different versions of SKDB around in case you need them.

```$ wget https://github.com/SkipLabs/skdb/raw/main/bin/skdb-linux-x64-0.9.bin
$ chmod 755 skdb-linux-x64-0.9.bin
$ sudo mv skdb-linux-x64-0.9.bin /usr/local/bin
$ sudo ln -s /usr/local/bin/skdb-linux-x64-0.9.bin /usr/local/bin/skdb
```

## Initialization

SKDB stores all of its data in a file specified by the user.
To initialize a database file, use the option '--init':

```$ skdb --init /tmp/test.db
```

Make sure you do not manipulate this file (copy, rename, etc.) while other processes are accessing the database.
By default the maximum capacity of the database is 16GB: once that capacity is reached the database will
become read-only. If you need a larger capacity, you can use the option '--capacity' at initialization time.

```$ skdb --init /tmp/test.db --capacity $YOUR_CHOICE_IN_BYTES
```

## Loading data

Let's first load some mock data to play with the database.

```$ wget https://github.com/SkipLabs/skdb/raw/main/docs/tiny_TPCH.sql
$ cat tiny_TPCH.sql | skdb --data /tmp/test.db
```

This created two tables. One named customer the other named orders.
Here are their schemas:

```$ skdb --dump-tables --data /tmp/test.db
CREATE TABLE customer (
  c_custkey INTEGER PRIMARY KEY,
  c_name TEXT,
  c_address TEXT,
  c_nationkey INTEGER,
  c_phone TEXT,
  c_acctbal FLOAT,
  c_mktsegment TEXT,
  c_comment TEXT
);
CREATE TABLE orders (
  o_orderkey INTEGER PRIMARY KEY,
  o_custkey INTEGER,
  o_orderstatus TEXT,
  o_totalprice FLOAT,
  o_orderdate TEXT,
  o_orderpriority TEXT,
  o_clerk TEXT,
  o_shippriority INTEGER,
  o_comment TEXT
);
```

Note that SKDB only supports 3 types:
64 bits integers (INTEGER),
64 bits floating point numbers (FLOAT)
and UTF-8 strings (TEXT).

By looking at the schema, we can see that the two tables are related through the columns 'c\_custkey' and 'o\_custkey'.
Each order identifies the customer that passed the order through a unique identifier (as it is often the case in
relational databases).


## Virtual views

At the core of SKDB, are virtual views.
Let's take an example:

```$ echo "create virtual view positive_bal_customers as select * from customer where c_acctbal > 0.0;" | skdb --data /tmp/test.db
```

In this example, we created a virtual view called 'positive\_bal\_customers' that regroups all the customers with a positive balance.
Virtual views are always maintained up-to-date by the database, so running a query on them is very fast.
For example:

```$ echo "select c_nationkey, avg(c_acctbal) from positive_bal_customers group by c_nationkey;" | skdb --data /tmp/test.db
```

That query would have run at the exact same speed had we created a separate table containing all the customers with a positive balance.
But what happens when a query involves multiple tables? This requires the use of a join, which you will see, works a bit differently in SKDB.

## Joins

Let's try to run a basic join:

```$ echo "select * from customer, orders where c_custkey = o_custkey;" | skdb --data /tmp/test.db
```

Surprisingly, this leads to an error (the error can be ignored with the option '--always-allow-joins'):

```$ echo "select * from customer, orders where c_custkey = o_custkey;" | skdb --data /tmp/test.db
select * from customer, orders where c_custkey = o_custkey;
^
|
 ----- ERROR
Error: line 1, characters 0-0:
Joins outside of virtual views are considered bad practice in skdb.
You should first create a virtual view joining customer and orders with a query of the form:
create virtual view customer_orders as select * from customer, orders where c_custkey = o_custkey;
And then use customer_orders directly.
PS: You can ignore this error message with --always-allow-joins (not recommended).
PS2: don't forget you can add indexes to virtual views.
```

The error message is pretty explicit. Joins outside of a virtual view are considered bad practice. But why is that?
The reason is that a join is an expensive operation. When you run it outside of a virtual view, you will have
to repeat that operation every single time the query is run.
A better approach is to create a virtual view once and for all and have all the subsequent queries
share the same virtual view. Let's follow the advice given in the error message:

```$ echo "create virtual view customer_orders as select * from customer, orders where c_custkey = o_custkey;" | skdb --data /tmp/test.db
```

This command created the virtual view 'customer\_orders', which can now be used like any other table.
The difference between a virtual view and a normal view is that the database will maintain that view up-to-date
at all times. In this case that means that any change in the customer or order table will be reflected in the virtual view 'customer\_orders'.
This also implies that reading from a virtual view is very fast, because the data is already there.
Let's find the orders from customer number 889:

```$ echo "select * from customer_orders where c_custkey = 889;" | skdb --data /tmp/test.db
889|Customer#000000889|pLvfd7drswfAcH8oh2seEct|13|23-625-369-6714|3635.3499999989999|FURNITURE|inal ideas. slowly pending frays are. fluff|931|889|F|155527.98000000001|1992-12-07|1-URGENT|Clerk#000000881|0|ss packages haggle furiously express, regular deposits. even, e
```

And that works for any query involving customers and orders. Instead of recomputing expensive joins every single time orders and customers are
involved, you can run those queries directly on the virtual view 'customer\_orders'.
To speed things up, we recommend you add indexes to your virtual views:

```$ echo "create index customer_orders_c_custkey ON customer_orders(c_custkey);" | skdb --data /tmp/test.db
```

If you are unsure about your queries, you can ask SKDB to list the indexes that were used for a particular query through the option '--show-used-indexes'.
This option is particularly useful when trying to optimize your queries.

```$ echo "select * from customer_orders where c_custkey = 889;" | skdb --data /tmp/test.db --show-used-indexes
USING INDEX: customer_orders_c_custkey
...
```


## Connections

Virtual views can be used to maintain an up-to-date query at all times, as we have just seen, but
they can also be used to be notified when changes occur.

For example, let's create a query that tracks all the customer with a negative balance:

```$ echo "create virtual view negative_balance as select * from customer where c_acctbal < 0.0;" | skdb --data /tmp/test.db
```

The creation of the virtual view does not trigger notifications. We need to "connect" to that view in order to receive them:

```$ skdb --data /tmp/test.db --connect negative_balance --updates /tmp/negative_balance
6050
```

With this command we instructed SKDB to send all the changes relative to the virtual view 'negative\_balance' to the file '/tmp/negative\_balance'.
In return, SKDB gave us the session number "6050", which will be useful to retrieve the status of that connection.

Let's have a look at the file:

```$ tail /tmp/negative_balance
1       875|Customer#000000875|8pQ4YUYox0d|3|13-146-810-5423|-949.27999999899998|FURNITURE|ar theodolites snooze slyly. furiously express packages cajole blithely around the carefully r
1       880|Customer#000000880|ogwHmUUFa1QB69pAoYAAoB0rjbdsVpAQ552e5Q,|8|18-763-990-8618|-77.629999999000006|FURNITURE|regular requests. regular deposits ar
1       885|Customer#000000885|nNUbC73nPBCKLg0|5|15-874-471-4903|-959.94000000000005|HOUSEHOLD|sits impress regular deposits. slyly silent excuses grow
...
```

The format is pretty straight forward. It's a key/value format, separated by a tab, where the key is the number of repetitions of a row and the value contains all the columns separated by a '|' (you can switch to csv with the option --csv).
That number corresponds to the total number of rows with that value. So if a row was already present 23 times, and a transaction adds an additional instance of that row, that number would become 24.
However, in practice, the number of repetition is often going to be 0 or 1 (0 for removal).
Also note that for ephemeral streams (which will be introduced later), that number is always 1.

You can check the status of every connection at all times with the option '--sessions':

```$ skdb --sessions --data /tmp/test.db
6050    /negative_balance/      CONNECTED
```

We can see that our connection is live. You can decide to disconnect a sessions with the option '--disconnect', but note that sessions will automatically disconnect in case of a problem.
The option '--reconnect', restarts the session where it started to fail and sends all the data that was missed since the disconnection.

Let's see what happens when the data changes:

```$ echo "delete from customer where c_custkey = 11;" | skdb --data /tmp/test.db
```

And see the effect in '/tmp/negative\_balance':

```$ tail /tmp/negative_balance
...
<-------- EMPTY LINE
<-------- EMPTY LINE
 0     11|Customer#000000011|PkWS 3HlXqwTuzrKg633BEi|23|33-464-151-3439|-272.60000000000002|BUILDING|ckages. requests sleep slyly. quickly even pinto beans promise above the slyly regular pinto beans.
```

A new line appeared notifying us that the customer 11 has been removed.
You may have noticed that two empty lines were introduced before the notification:
those lines tell us that the database finished a transaction and is starting a new one. If you are ingesting the changes, you
can safely assume that the database was in a consistent state at that point.

## Diffing

Waiting for changes is fine, but the problem is that the changes are "pushed" to the user.
Sometimes, we will need to operate the other way around: the user will want to "pull" changes,
by asking periodically what has changed since the last time around.

Fortunately, SKDB has the solution: the '--diff' option.
Let's create a new connection, this time without the associated '--updates' option:

```$ skdb --data /tmp/test.db --connect negative_balance
6065
```

And use the session number to get a "diff":

```$ skdb --diff 6065 --since 0 --data /tmp/test.db
Time: 26
0       11|Customer#000000011|PkWS 3HlXqwTuzrKg633BEi|23|33-464-151-3439|-272.60000000000002|BUILDING|ckages. requests sleep slyly. quickly even pinto beans promise above the slyly regular pinto beans.
1       33|Customer#000000033|qFSlMuLucBmx9xnn5ib2csWUweg D|17|27-375-391-1280|-78.560000000000002|AUTOMOBILE|s. slyly regular accounts are furiously. carefully pending requests
1       37|Customer#000000037|7EV4Pwh,3SboctTWt|8|18-385-235-7162|-917.75|FURNITURE|ilent packages are carefully among the deposits. furiousl
...
```

Note that we used '--diff' in conjuction with '--since'. The '--since' option takes a timestamp produced by the database.
The timestamp 0 corresponds to the beginning of times. So asking for a diff since time 0 will get you all the data associated
with a session.
The first line above contains a timestamp ('Time: 26') that will be a useful diff
point for us shortly.

Let's now make some modifications:

```$ echo "delete from customer where c_custkey = 33;" | skdb --data /tmp/test.db
```

And ask for the diff since the timestamp from above (26):

```$ skdb --diff 6065 --since 26 --data /tmp/test.db
Time: 29
0       33|Customer#000000033|qFSlMuLucBmx9xnn5ib2csWUweg D|17|27-375-391-1280|-78.560000000000002|AUTOMOBILE|s. slyly regular accounts are furiously. carefully pending requests
```

The output gives us the next timestamp (25) plus the diff (the removal of the user 33).
You can repeat that operation as often as you want, at the rate you want, which makes
it convenient to pull changes periodically.

## --updates vs --diff

So when should you use '--updates' and when should you use a '--diff'?
You should use '--updates' if you need your changes to be live, and when you are confident that
the process that handles the changes will be able to keep up with the write rate of the database.

## Streaming

SKDB also supports ephemeral tables called streams. They work exactly like a normal
SQL table, except that they do not persist on disk:

```$ echo "create stream customer_connect_log (clog_custkey INTEGER, clog_time INTEGER);" | skdb --data /tmp/test.db
```

We just declared an ephemeral data stream called 'customer\_connect\_log'.
We can now use that table to log every time a customer connects to the system.
The difference with a "normal" table, is that the data is ephemeral (it will not persist on disk).
So what's the point of a stream you may ask? It comes in handy when trying to receive alerts.
For example, imagine we wanted to receive and alert every time a customer with a negative balance connected to our system.

Step 1, we join the log with the table of customers (it's better to keep that as a separate step,
to be able to reuse the view 'customer\_log'):

```$ echo "create virtual view customer_log as select * from customer_connect_log, customer where c_custkey = clog_custkey;" | skdb --data /tmp/test.db
```

Step 2, we create a virtual view tracking connection of users with a negative balance:

```$ echo "create virtual view negative_bal_connection as select * from customer_log where c_acctbal < 0.0;" | skdb --data /tmp/test.db
```

Finally, we connect to that view:

```$ skdb --connect negative_bal_connection --updates /tmp/negative_bal_connection --data /tmp/test.db
7090
```

Let's see what happens when we add data to the stream (using '--load-csv' is faster than 'INSERT' statements when
manipulating streams):

```$ for i in {1..10000}; do echo "$i, $i"; done | skdb --data /tmp/test.db --load-csv customer_connect_log
```

And check the result in '/tmp/negative\_bal\_connection':

```$ tail -f /tmp/negative_bal_connection
1       995|995|995|Customer#000000995|5tCSAsm4qL5OvHdRZsiwSlVTdqPZws3f|13|23-272-700-1002|-341.79000000000002|BUILDING|wake slyly fluffily unusual requests. stealthily regular pinto beans are along the slyly final dugouts. slyly 
...
```

As expected, we got notified every time a customer with a negative balance connected.
To make the performance more predictable, SKDB will never spawn threads or fork processes behind your back. However, you should feel free to use multiple processes to speedup the ingestion of
data, including when targetting the same stream (Because SKDB supports multiple writers/readers).
In this case, we could for example get 10 processes writing on the stream 'customer\_connect\_log' at the same time:

```$ for j in {1..10}; do (for i in {1..10000}; do echo "$i, $i"; done | skdb --data /tmp/test.db --load-csv customer_connect_log)& done; wait
```

If you replace the '&' with a ';', you will see a dramatic slow down in the ingestion rate of
the data.

On a laptop with more than 10 cores, the sequential time is 1.0s, while only 0.2s when
using 10 processes (so roughly 5X faster).

## Real-time analytics.

As mentioned earlier, streams are ephemeral. So what happens when using aggregate functions on them?

```$ echo "select count(*) from customer_connect_log;" | skdb --data /tmp/test.db
^
|
 ----- ERROR
Error: line 1, characters 0-0:
Cannot use a stream for aggregates, use a window instead
```

We get an error. The error invites us to use a "window". A window is exactly like a stream, except that
it will persist data for a certain time. It's the kind of table you will need to compute real-time analytics.
For example, let's say we want to keep the data received in the last hour.

```$ echo "create window 3600 customer_connect_window (cw_time INTEGER, cw_custkey INTEGER);" | skdb --data /tmp/test.db
```

The first column of a window is always expected to be a timestamp (an integer corresponding to a number of seconds since a fixed time in the past).
The number 3600 corresponds to the number of seconds we want to persist the data.

Now that we successfully created a window, let's run a query on it. Let's compute the average
account balance of the customers who connected in the last hour.
As usual, we first compute the join as a separate step:

```$ echo "create virtual view customer_window as select * from customer_connect_window, customer where cw_custkey = c_custkey;" | skdb --data /tmp/test.db
```

And then produce the average based on that virtual view:

```$ echo "create virtual view avg_balance as select avg(c_acctbal) from customer_window;" | skdb --data /tmp/test.db
```

Now let's connect to that view:

```$ skdb --connect avg_balance --updates /tmp/avg_balance --data /tmp/test.db
```

And add some data:

```$ for i in {1..500}; do echo "$i, $i"; done | skdb --data /tmp/test.db --load-csv customer_connect_window
```

And look at the file of updates:

```$ tail /tmp/avg_balance
...
1       711.55999999899996
<--- NEWLINE
<--- NEWLINE
1       4531.63158634502
```

So you may wonder, how often is '/tmp/avg\_balance' updated? On every single change?
Windows are different from streams and normal SQL tables in that regard.
When using a window, the database can decide to regroup changes together.
So in this case, there might have been intermediate values between 711.5 and 4531.6 that were
never sent to the stream of changes.
The reason is that most of the time, we don't care how many elements are exactly present in given windows. So regrouping insertions makes sense (and speeds things up).
If you are unhappy with that behavior, and you want notifications for every single window insert to be triggered, you can pass the option '--force-window-update',
which will make windows work like streams (or normal sql tables) in that regard.

Let's try it:

```$ for i in {500..1000}; do echo "$i, $i"; done | skdb --data /tmp/test.db --load-csv customer_connect_window --force-window-update
```

If you look at the file '/tmp/avg\_balance' you can see that all the updates are there.

```$ wc /tmp/avg_balance
 1509  1005 11507 /tmp/avg_balance
```

## Time and ID

Sometimes, you will want the database to generate a timestamp for you.
When that's the case, you can use the "time" function.

```$ echo "insert into customer_connect_window values(time(), 34);" | skdb --data /tmp/test.db
```

Similarly, we can generate primary keys by using the function "id".

```$ echo "insert into orders values (id(), 568, 'F', 133466.829999999, '1992-01-04', '5-LOW', 'Clerk#000000339', 0, '');" | skdb --data /tmp/test.db
```

If you need to use an id in multiple places (in a transaction for example), you can name them.
So for example you could use multiple instances of id('a'), they would all be referring to the same id within the same transaction.


## Streams vs Windows

You should always prefer streams to windows: they are faster and require less memory.
So only use windows when you have to use an aggregate function, typically for analytics.

## Bug report

Feel free to file github issues here: [https://github.com/SkipLabs/skdb](https://github.com/SkipLabs/skdb)

## Thank you for reading!
