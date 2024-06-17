# Test: is copied file's package detected

This setup is intended to create reproducible results (SBoM).  
It might install outdated, unmaintained or vulnerable components, for showcasing purposes.

Importing `libphonenumber-js/max` should not result in `libphonenumber-js/max` being added to the SBoM without any version.
Instead `libphonenumber-js` should be added with the correct version.

Importing `luxon` should result in `luxon` being added to the SBoM.
