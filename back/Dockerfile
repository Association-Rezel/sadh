FROM python:3.12

WORKDIR /app

COPY ./ /app/

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Any proxy will be trusted. Since we control our network, this should be safe.
ENV FORWARDED_ALLOW_IPS="*"

CMD ["uvicorn", "--factory", "back:make_app", "--host", "0.0.0.0", "--port", "80"]
