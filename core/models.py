from django.db import models
class SiteData(models.Model):
 key=models.CharField(max_length=100,unique=True); value=models.JSONField(default=list); updated_at=models.DateTimeField(auto_now=True)
