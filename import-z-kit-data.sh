#!/bin/bash

curl -si -HX-User:admin -HX-Password:zurichNov16 -d @insurance-companies.json http://localhost:8082/structr/rest/InsuranceCompany
curl -si -HX-User:admin -HX-Password:zurichNov16 -d @insurance-types.json http://localhost:8082/structr/rest/InsuranceType
curl -si -HX-User:admin -HX-Password:zurichNov16 -d @payment-types.json http://localhost:8082/structr/rest/PaymentType
