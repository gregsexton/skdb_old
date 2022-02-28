#!/bin/bash

rm -f docs_body.html commands.txt commands.sh commands_result commands_expected
rm -f /tmp/test.db /tmp/negative_balance /tmp/customer_orders /tmp/avg_balance
rm -f /tmp/negative_bal_connection

(cd ../gen && cat ../docs/docs.md | sk > ../docs/commands.txt)

touch commands.sh
chmod 777 commands.sh

echo "skdb --init /tmp/test.db" >> commands.sh
cat commands.txt | egrep '^[$] ' | sed 's/[$] //' | sed 's/tail -f/tail/g' |tail -n +6 >> commands.sh

touch commands_result

./commands.sh 2>> ./commands_result >> ./commands_result

cat commands.txt | egrep -v '^[$]' > ./commands_expected

diff -w ./commands_result ./commands_expected | egrep -v '[-][-][-]' | egrep '^[>] ' || true

markdown docs.md > docs_body.html

rm -f docs.html
touch docs.html

cat docs_header.html >> docs.html
cat docs_body.html | sed 's/<code/<pre><code class="hljs"/g' | sed 's/<\/code>/<\/code><\/pre>/g' >> docs.html

for i in `grep -n "<code [^i]" docs.html | cut -f1 -d:`; do
    sed -i "0,/<code \([^i]\)/s/<code \([^i]\)/<code id=\"code$i\" \1/" docs.html 
    sed -i "0,/<\/code><\/pre>/s/<\/code><\/pre>/<\/code><button style=\"float: right;\" onclick=\"CopyToClipboard('code$i');return false;\">Copy<\/button><div>  <\/div><\/pre>/" docs.html 
done
cat docs_footer.html >> docs.html

cp docs.html  ../
