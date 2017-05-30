#!/bin/bash
#

TESTLOG=/opt/structr/structr-ui/logs/test.log
ERRORLOG=/opt/structr/structr-ui/logs/mail_errors.log
BASEURL=http://localhost:8082/structr
USERNAME=admin
PASSWORD=zurichNov16

# make sure $TESTLOG exists

# create new entry in test log file
echo "##################################################################################################" >>$TESTLOG

# extract the ID of an existing entity from a GET request
# usage: $(get_id type key value)
get_id() {

	if [ -z "$1" ]; then break; fi
	if [ -z "$2" ]; then break; fi
	if [ -z "$3" ]; then break; fi
	
	echo $(curl -si -HX-User:$USERNAME -HX-password:$PASSWORD $BASEURL/rest/$1?$2=$3 | grep id | sed 's/\(.*\)\([0-9a-f]\{32\}\)\(.*\)/\2/')
}

# extract the ID of a new entity from a POST request using Location: header
# usage: $(extract_id response)
extract_id() {
	echo $1 |grep "Location: " | sed 's/\(.*\)\([0-9a-f]\{32\}\)\(.*\)/\2/'
}

# store mail in var MAIL
MAIL=`cat -`
echo "$MAIL" >> /opt/structr/structr-ui/logs/raw.log

# extract from and from address from From: header
FROM=`echo "$MAIL" | sed -n 's/^\(From: \)\(.*\)$/\2/p'`
FROM_ADDRESS=`echo "$FROM" | sed 's/ *(.*)//; s/>.*//; s/.*[:<] *//'`

# extract subject and ticket ID from Subject: header
SUBJECT=`echo "$MAIL" | sed -n 's/^\(Subject: \)\(.*\)$/\2/p'`
ID=`echo $SUBJECT | sed 's/.*\([a-f0-9]\{32\}\).*/\1/gi'`

# extract content type from Content-Type: header
CONTENT_TYPE=`echo "$MAIL" | sed -n 's/^\(Content-Type: \)\(.*\)$/\2/p'`

# extract MIME message ID from In-Reply-To: header
PARENT_MESSAGE_ID=`echo "$MAIL" | sed -n 's/^\(In-Reply-To: \)\(.*\)$/\2/p'`

# save IFS
OLD_IFS=$IFS

# set IFS to newline only
IFS='
'

# create temporary directory for MIME processing
TMPDIR=`mktemp -d`

# try to extract MIME parts from message into different files
for i in `echo "$MAIL" |munpack -fqtC $TMPDIR`; do

	if [ "${i:0:21}" == "Did not find anything" ]; then

		# we need to extract the plaintext part here..
		PLAINTEXT=`echo "$MAIL" | sed '1,/^$/d' | sed 's/"/\\\"/g'`

	else
	
		# this is a MIME part we want!
		PART_NAME=`echo $i |awk '{ print $1; }'`
		PART_TYPE=`echo $i |awk '{ print substr($2, 2, length($2)-2); }'`
		
		echo "Part name: $PART_NAME" >>$TESTLOG
		echo "Part type: $PART_TYPE" >>$TESTLOG

		case "$PART_TYPE" in
		
			"text/plain")
				PLAINTEXT=`cat $TMPDIR/$PART_NAME`
				;;
				
			"text/html")
				HTMLTEXT=`cat $TMPDIR/$PART_NAME`
				;;

			"image/jpeg"|"image/jpg"|"image/png"|"image/gif")

				# process image attachments
				if [ -z "$IMAGE_ATTACHMENTS" ]; then
					IMAGE_ATTACHMENTS="$TMPDIR/$PART_NAME"
				else
					IMAGE_ATTACHMENTS="$IMAGE_ATTACHMENTS $TMPDIR/$PART_NAME"
				fi
				;;
				
			*)
			
				# process file attachments
				if [ -z "$FILE_ATTACHMENTS" ]; then
					FILE_ATTACHMENTS="$TMPDIR/$PART_NAME"
				else
					FILE_ATTACHMENTS="$FILE_ATTACHMENTS $TMPDIR/$PART_NAME"
				fi
				;;
			
		esac
	
	fi

done

echo "$PLAINTEXT" >> /opt/structr/structr-ui/logs/messages.log
echo "---------------------------------------------------------------------------------" >> /opt/structr/structr-ui/logs/messages.log

echo "$HTMLTEXT" >> /opt/structr/structr-ui/logs/html-messages.log
echo "---------------------------------------------------------------------------------" >> /opt/structr/structr-ui/logs/html-messages.log

echo "$FROM_ADDRESS" >>$TESTLOG
echo "$PARENT_MESSAGE_ID" >>$TESTLOG
echo "$CONTENT_TYPE" >>$TESTLOG

# create new ticket for user?
NEW_TICKET_RESPONSE=$(curl -i -HX-User:$USERNAME -HX-password:$PASSWORD -XPOST $BASEURL/rest/ReceivedEmail -d "{subject: \"$SUBJECT\", text: \"$PLAINTEXT\", ownerMailAddress: \"$FROM_ADDRESS\"}")

echo "New object response: $NEW_TICKET_RESPONSE" >>$TESTLOG
	
# store ticket ID
ID=$(extract_id "$NEW_TICKET_RESPONSE")

echo "New object UUID: $ID" >>$TESTLOG

# restore internal field separator
IFS=$OLD_IFS

# process image attachments
if [ -n "$IMAGE_ATTACHMENTS" ]; then

	# upload attachments
       	for i in $IMAGE_ATTACHMENTS; do

		NEW_DOCUMENT_ID=$(curl -s -HX-User:$USERNAME -HX-Password:$PASSWORD -F"type=File" -F"email=$ID" -F"file=@$i" $BASEURL/upload -XPOST)
		curl -i -HX-User:$USERNAME -HX-Password:$PASSWORD $BASEURL/rest/File/$NEW_DOCUMENT_ID/updateContentFromUpload -XPOST >>$TESTLOG

        done
fi

# process file attachments
if [ -n "$FILE_ATTACHMENTS" ]; then

	# upload attachments
       	for i in $FILE_ATTACHMENTS; do

		NEW_DOCUMENT_ID=$(curl -s -HX-User:$USERNAME -HX-Password:$PASSWORD -F"type=File" -F"email=$ID" -F"file=@$i" $BASEURL/upload -XPOST)
		curl -i -HX-User:$USERNAME -HX-Password:$PASSWORD $BASEURL/rest/File/$NEW_DOCUMENT_ID/updateContentFromUpload -XPOST >>$TESTLOG

        done
fi

# remove temporary directory
#rm -rf $TMPDIR
