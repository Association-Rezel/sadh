FROM python:3.11.2
#test
WORKDIR /app

COPY ./ /app/

# Make Sure rezel root CA is installed
ADD https://ca.rezel.net/rezel_2015_ca.crt /usr/share/ca-certificates/
RUN update-ca-certificates

# Make sure requests will trust rezel root CA
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
# Make sure httpx will trust rezel root CA
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt 

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Any proxy will be trusted. Since we control our network, this should be safe.
ENV FORWARDED_ALLOW_IPS="*"

CMD ["uvicorn", "--factory", "back:make_app", "--host", "0.0.0.0", "--port", "80"]
