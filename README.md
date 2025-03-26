# Index Row Size Error Investigation

The error indicates that the index row size exceeds PostgreSQL limits. This often happens when storing large binary data (e.g., images) directly in the table. It's best to store the image in the profile_photos bucket and save only the URL reference in your table.

In summary, yes – you're likely hitting the error by storing the image directly instead of its URL.
