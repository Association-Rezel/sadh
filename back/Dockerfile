FROM python:3.11.2

WORKDIR /app

COPY ./ /app/

# Make Sure rezel root CA is installed
ADD https://ca.rezel.net/rezel_2015_ca.crt /usr/local/share/ca-certificates/rezel.crt
RUN update-ca-certificates

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

CMD ["uvicorn", "--factory", "back:make_app", "--host", "0.0.0.0", "--port", "80"]
