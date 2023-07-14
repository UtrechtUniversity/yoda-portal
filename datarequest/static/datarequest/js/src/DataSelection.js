import React, { Component } from "react";
import { render } from "react-dom";
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { numberFilter, textFilter, selectFilter, multiSelectFilter, Comparator } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';

const data = [
  { "expId": 1, "expCohort": 0, "expWave": 0, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 2, "expCohort": 0, "expWave": 0, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 3, "expCohort": 0, "expWave": 0, "expType": 0, "expSubject": 3, "expName": 5, "expInfo": "10 mL EDTA-plasma collected through venapunction, stored in 3 aliquots of cell pellets in 900 micro L containers at -80 oC", "expAdditionalRemarks": null },
  { "expId": 4, "expCohort": 0, "expWave": 0, "expType": 0, "expSubject": 3, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 5, "expCohort": 0, "expWave": 0, "expType": 0, "expSubject": 5, "expName": 5, "expInfo": "20 mL serum and 10 mL EDTA-plasma collected through venapunction, stored in 12 aliquots of serum, 6 aliquots of plasma and 3 aliquots of cell pellets, in 900 micro L containers at -80 oC", "expAdditionalRemarks": null },
  { "expId": 6, "expCohort": 0, "expWave": 0, "expType": 0, "expSubject": 5, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 7, "expCohort": 0, "expWave": 0, "expType": 4, "expSubject": 0, "expName": 37, "expInfo": "All pregnant women are asked to visit us at 20 and 30 weeks gestational age for an advanced fetal neurosonograpy to study fetal brain development. Using ultrasound we scan the fetal brain for 3D volumes and in addition the fetal biometry (abdominal circumference, head circumference and femur length)\u00a0 and Doppler studies (cerebral medial artery, umbilical artery and the uterine arteries) are performed.", "expAdditionalRemarks": null },
  { "expId": 8, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 3, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 9, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 3, "expName": 6, "expInfo": "Brief Symptom Inventory (BSI)", "expAdditionalRemarks": null },
  { "expId": 10, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 3, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 11, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 3, "expName": 41, "expInfo": "Medical & Psychiatric problems of first degree family members", "expAdditionalRemarks": "From R0-10m onwards only psychiatric family background" },
  { "expId": 12, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 3, "expName": 52, "expInfo": "General health questionnaire", "expAdditionalRemarks": null },
  { "expId": 13, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 3, "expName": 68, "expInfo": "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 14, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 3, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 15, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 16, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 6, "expInfo": "Brief Symptom Inventory (BSI)", "expAdditionalRemarks": "By mistake, for a short periode of time, women included in Around 0 - 4-6 months received this questionnaire instead of the \"Uw emotionele toestand\" (Edinburgh Postnatal Depression Scale) questionnaire." },
  { "expId": 17, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 18, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 41, "expInfo": "Medical & Psychiatric problems of first degree family members", "expAdditionalRemarks": "From R0-10m onwards only psychiatric family background" },
  { "expId": 19, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 44, "expInfo": "Food intake questionnaire (FFQ) focussed on intake of energy, macronutrients, n-3 fatty acids, vitamin D, B-vitamins and folac acid during pregnancy", "expAdditionalRemarks": null },
  { "expId": 20, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 52, "expInfo": "General health questionnaire", "expAdditionalRemarks": null },
  { "expId": 21, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 68, "expInfo": "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", "expAdditionalRemarks": null },
  { "expId": 22, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 71, "expInfo": "List of longterm stressful life events selected by GenerationR", "expAdditionalRemarks": null },
  { "expId": 23, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 24, "expCohort": 0, "expWave": 0, "expType": 10, "expSubject": 5, "expName": 93, "expInfo": "Periconceptual health", "expAdditionalRemarks": null },
  { "expId": 25, "expCohort": 0, "expWave": 1, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 26, "expCohort": 0, "expWave": 1, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 27, "expCohort": 0, "expWave": 1, "expType": 0, "expSubject": 5, "expName": 53, "expInfo": "Approximately 200 strings of hair  cut from the back of the head of the participant as close as possible to the skin, stored in  special envelopes in  fire  proof cabinets", "expAdditionalRemarks": null },
  { "expId": 28, "expCohort": 0, "expWave": 1, "expType": 4, "expSubject": 0, "expName": 37, "expInfo": "All pregnant women are asked to visit us at 20 and 30 weeks gestational age for an advanced fetal neurosonograpy to study fetal brain development. Using ultrasound we scan the fetal brain for 3D volumes and in addition the fetal biometry (abdominal circumference, head circumference and femur length)\u00a0 and Doppler studies (cerebral medial artery, umbilical artery and the uterine arteries) are performed.", "expAdditionalRemarks": null },
  { "expId": 29, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 3, "expName": 21, "expInfo": "Childhood Trauma Questionnaire (CTQ)", "expAdditionalRemarks": null },
  { "expId": 30, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 3, "expName": 25, "expInfo": "Utrechtse Coping Lijst (UCL)", "expAdditionalRemarks": null },
  { "expId": 31, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 3, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 32, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 3, "expName": 94, "expInfo": "Personality questionnaire (NEO-FFI-3)", "expAdditionalRemarks": null },
  { "expId": 33, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 3, "expName": 96, "expInfo": "Portrait values questionnaire - revised (PVQ-RR)", "expAdditionalRemarks": null },
  { "expId": 34, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 3, "expName": 103, "expInfo": "Social Responsiveness Scale for Adults (SRS-A)", "expAdditionalRemarks": null },
  { "expId": 35, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 3, "expName": 114, "expInfo": "Work demographics", "expAdditionalRemarks": null },
  { "expId": 36, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 5, "expName": 21, "expInfo": "Childhood Trauma Questionnaire (CTQ)", "expAdditionalRemarks": null },
  { "expId": 37, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 5, "expName": 25, "expInfo": "Utrechtse Coping Lijst (UCL)", "expAdditionalRemarks": null },
  { "expId": 38, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 5, "expName": 68, "expInfo": "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", "expAdditionalRemarks": null },
  { "expId": 39, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 5, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 40, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 5, "expName": 94, "expInfo": "Personality questionnaire (NEO-FFI-3)", "expAdditionalRemarks": null },
  { "expId": 41, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 5, "expName": 96, "expInfo": "Portrait values questionnaire - revised (PVQ-RR)", "expAdditionalRemarks": null },
  { "expId": 42, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 5, "expName": 103, "expInfo": "Social Responsiveness Scale for Adults (SRS-A)", "expAdditionalRemarks": null },
  { "expId": 43, "expCohort": 0, "expWave": 1, "expType": 10, "expSubject": 5, "expName": 114, "expInfo": "Work demographics", "expAdditionalRemarks": null },
  { "expId": 44, "expCohort": 0, "expWave": 2, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 45, "expCohort": 0, "expWave": 2, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 46, "expCohort": 0, "expWave": 2, "expType": 0, "expSubject": 0, "expName": 26, "expInfo": "10 mL EDTA- plasma sample from the umbilical cord at birth, stored in 900 micro L containers at -80 oC", "expAdditionalRemarks": null },
  { "expId": 47, "expCohort": 0, "expWave": 2, "expType": 7, "expSubject": 1, "expName": 3, "expInfo": "A T2-weighted turbo fast spin-echo sequence with the following parameters: 110x1.2mm slices; echo time (TE) 150 ms; repetition time (TR) 4851 ms; flip angle 90 degrees; in-plane voxel size 1.2 x 1.2mm^2. The raw Philips DICOM files were converted to NIfTi format via dcm2niix (v20190112, https://github.com/rordenlab/dcm2niix) and volumes were calculated with the dHCP method (https://github.com/BioMedIA/dhcp-structural-pipeline). We visually checked the scans and segmentations for quailty. ", "expAdditionalRemarks": null },
  { "expId": 48, "expCohort": 0, "expWave": 2, "expType": 7, "expSubject": 1, "expName": 34, "expInfo": "DTI 45 directions sequence with the following parameters: 45 2mm slices; echo time (TE) 80 ms; repetition time (TR) 6500 ms; flip angle 90 degrees; in-plane voxel size 2x2mm^2. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 49, "expCohort": 0, "expWave": 2, "expType": 7, "expSubject": 1, "expName": 50, "expInfo": "fMRI resting state scan while the baby was asleep/resting, with the following parameters:  256 3.25mm slices; echo time (TE) 45 ms; repetition time (TR) 1508 ms; flip angle 50 degrees; in-plane voxel size 3.25x4mm^2. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 50, "expCohort": 0, "expWave": 2, "expType": 7, "expSubject": 6, "expName": 3, "expInfo": "Coronal, saggital and/or axial T2-weighted turbo fast spin-echo sequences with the following parameters: 80 2.5mm slices; echo time (TE) 180 ms; repetition time (TR) 55321 ms; flip angle 110 degrees; in-plane voxel size 1.25 x 1.25mm^2. The raw Philips DICOM files were converted to NIfTi format via dcm2niix (v20190112, https://github.com/rordenlab/dcm2niix) and 3D reconstructed with the dHCP method (https://github.com/SVRTK/SVRTK). We visually checked the scans and segmentations for quailty. ", "expAdditionalRemarks": null },
  { "expId": 51, "expCohort": 0, "expWave": 2, "expType": 7, "expSubject": 6, "expName": 34, "expInfo": "DTI b400 with the following parameters: 45 2mm slices; echo time (TE) 117 ms; repetition time (TR) 7533 ms; flip angle 90 degrees; in-plane voxel size 2x2mm^2. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 52, "expCohort": 0, "expWave": 2, "expType": 7, "expSubject": 6, "expName": 50, "expInfo": "FE EPI with the following parameters: 180 3.5mm slices; echo time (TE) 30 ms; repetition time (TR) 2000 ms; flip angle 82 degrees; in-plane voxel size 3.5 x 3.5mm^2. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 53, "expCohort": 0, "expWave": 2, "expType": 10, "expSubject": 5, "expName": 62, "expInfo": "Labour and Birth", "expAdditionalRemarks": null },
  { "expId": 54, "expCohort": 0, "expWave": 3, "expType": 11, "expSubject": 0, "expName": 32, "expInfo": "Gender and age of child are withdrawn from the participant registration system. Age of the child is calculated in weeks: difference in experiment date and date of birth rounded down in whole weeks", "expAdditionalRemarks": null },
  { "expId": 55, "expCohort": 0, "expWave": 3, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 56, "expCohort": 0, "expWave": 3, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 57, "expCohort": 0, "expWave": 3, "expType": 0, "expSubject": 0, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 58, "expCohort": 0, "expWave": 3, "expType": 3, "expSubject": 0, "expName": 23, "expInfo": "This task serves two purposes: first, to observe how the developing brain signal decomposes into separate frequency bands as a function of what the child sees; second: to understand how the connectivity among different areas of the developing brain develops.Infants passively watch 60-second video clips depicting singing women or moving toys while we measure their EEG. This task lasts 3 minutes.Stimuli were two sets of videos. One is a set of 'non-social' videos depicting moving toys without human interference, earlier used in a study by Jones and colleagues (Developmental changes in infant brain activity during naturalistic social experiences. Developmental Psychobiology, 57(7; 2015)). The other is a set of 'social' videos depicting singing women (Dutch stimuli created by Sabine Hunnius and colleagues). Both sets are 60 seconds long.", "expAdditionalRemarks": null },
  { "expId": 59, "expCohort": 0, "expWave": 3, "expType": 3, "expSubject": 0, "expName": 40, "expInfo": "To understand how the developing brain differentially responds to viewing pictures of faces vs. houses. Infants or children up to the age of 6 passively watch pictures of (neutral) faces (12 faces repeated four times) and pictures of typical Dutch houses (also 12 x 4) while we measure their EEG. This task lasts 4 minutes.  ", "expAdditionalRemarks": null },
  { "expId": 60, "expCohort": 0, "expWave": 3, "expType": 5, "expSubject": 0, "expName": 56, "expInfo": "One of the key research findings that make humans an extraordinary social species is that human faces, above anything else, grab and hold our attention. In adults the power of faces has been widely demonstrated. But already in infancy this interest in faces is apparent. For instance, when six-month-olds see an array of items, their first fixations fall more often than expected by chance on the only face (Gliga, Elsabbagh, Andravizou & Johnson, 2009). This phenomenon is known as the face pop-out - phenomenon. The current experiment is a shortened version of this face -pop out experiment (Gliga et al, 2009 Exp1; Elsabbagh et al., 2013): it is a free viewing experiment in which children from the Baby&Kind cohort are presented with multiple five-item arrays (always: 1. Human face; 2. Car; 3. Mobile phone; 4. Bird; 5; Face-shaped noise figure). It tests whether children automatically orient to faces and whether they prefer to look at faces (i.e. look disproportionally longer to faces). ", "expAdditionalRemarks": null },
  { "expId": 61, "expCohort": 0, "expWave": 3, "expType": 5, "expSubject": 0, "expName": 57, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation.\u00a0 Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": null },
  { "expId": 62, "expCohort": 0, "expWave": 3, "expType": 5, "expSubject": 0, "expName": 58, "expInfo": "The social gaze task is an eye-tracking task at all waves (except pregnancy) that measures a subject's sensitivity to another person's gaze direction as a possible cue to predict the location of a next event. Sensitivity to gaze direction is taken as a marker of social competence. In a trial, children see a face with direct gaze, followed by an eye gaze shift to one side, followed by a small object ('target') that appears on the cued side or the opposite side. The dependent variable is the latency with which the child detects the target. Generally, people detect targets on the cued side faster than targets on the opposite side. The reaction time differences between cued and opposite-side targets have been taken to reflect better social skill.", "expAdditionalRemarks": null },
  { "expId": 63, "expCohort": 0, "expWave": 3, "expType": 9, "expSubject": 2, "expName": 80, "expInfo": "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (clean-up and a teaching task), and a pleasant event (unstructured free play). The PCI tasks take about 15 minutes to complete.", "expAdditionalRemarks": null },
  { "expId": 64, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 3, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 65, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 3, "expName": 68, "expInfo": "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 66, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 3, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 67, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 5, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 68, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 5, "expName": 38, "expInfo": "Edinburgh Postnatal Depression Scale (EPDS)", "expAdditionalRemarks": "By mistake, for a short periode of time, women included in Around 0 - 4-6 months received the \"Uw emotionele gesteldheid\" (Brief Symptom Inventory) questionnaire instead of this questionnaire." },
  { "expId": 69, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 5, "expName": 68, "expInfo": "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", "expAdditionalRemarks": null },
  { "expId": 70, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 5, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 71, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 5, "expName": 104, "expInfo": "Social Support List (SSL)", "expAdditionalRemarks": null },
  { "expId": 72, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 7, "expName": 2, "expInfo": "Ages and Stages Questionnaire - Social Emotional (ASQ-SE)", "expAdditionalRemarks": null },
  { "expId": 73, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 7, "expName": 13, "expInfo": "Rothbart's Temperament Questionnaire (IBQ-R SF, ECBQ-SF, CBQ-SF, TMCQ) - subscales: Perceptual Sensitivity, Low Intensity Pleasure, Attentional Focussing, Inhibitory control, Impulsivity (only in Around 6)", "expAdditionalRemarks": null },
  { "expId": 74, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 7, "expName": 18, "expInfo": "Medical questionnaire on child's health and Gender Identity (GI)", "expAdditionalRemarks": null },
  { "expId": 75, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 7, "expName": 24, "expInfo": "Comprehensive Early Childhood Parenting Questionnaire (CECPAQ)", "expAdditionalRemarks": null },
  { "expId": 76, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 7, "expName": 30, "expInfo": "Daily care of the child", "expAdditionalRemarks": null },
  { "expId": 77, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 7, "expName": 45, "expInfo": "Food Frequency Questionnaire (FFQ)", "expAdditionalRemarks": null },
  { "expId": 78, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 7, "expName": 64, "expInfo": "Spoken language in child's environment", "expAdditionalRemarks": "In R3 and R6 these questions are part of YBQUEPCCLFB" },
  { "expId": 79, "expCohort": 0, "expWave": 3, "expType": 10, "expSubject": 7, "expName": 83, "expInfo": "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", "expAdditionalRemarks": null },
  { "expId": 80, "expCohort": 0, "expWave": 4, "expType": 11, "expSubject": 0, "expName": 32, "expInfo": "Gender and age of child are withdrawn from the participant registration system. Age of the child is calculated in weeks: difference in experiment date and date of birth rounded down in whole weeks", "expAdditionalRemarks": null },
  { "expId": 81, "expCohort": 0, "expWave": 4, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 82, "expCohort": 0, "expWave": 4, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 83, "expCohort": 0, "expWave": 4, "expType": 0, "expSubject": 0, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 84, "expCohort": 0, "expWave": 4, "expType": 0, "expSubject": 0, "expName": 53, "expInfo": "Approximately 200 strings of hair  cut from the back of the head of the participant as close as possible to the skin, stored in  special envelopes in  fire  proof cabinets", "expAdditionalRemarks": "27-06-2019: stopped collecting hair at 10m due to poor data quality." },
  { "expId": 85, "expCohort": 0, "expWave": 4, "expType": 3, "expSubject": 0, "expName": 23, "expInfo": "This task serves two purposes: first, to observe how the developing brain signal decomposes into separate frequency bands as a function of what the child sees; second: to understand how the connectivity among different areas of the developing brain develops.Infants passively watch 60-second video clips depicting singing women or moving toys while we measure their EEG. This task lasts 3 minutes.Stimuli were two sets of videos. One is a set of 'non-social' videos depicting moving toys without human interference, earlier used in a study by Jones and colleagues (Developmental changes in infant brain activity during naturalistic social experiences. Developmental Psychobiology, 57(7; 2015)). The other is a set of 'social' videos depicting singing women (Dutch stimuli created by Sabine Hunnius and colleagues). Both sets are 60 seconds long.", "expAdditionalRemarks": null },
  { "expId": 86, "expCohort": 0, "expWave": 4, "expType": 3, "expSubject": 0, "expName": 39, "expInfo": "To understand how the developing brain differentially responds to viewing faces with different facial expressions (happy and fear). Young children (from 10 months onwards) passively watch pictures of happy or fearful faces while we measure their EEG. Note that the same faces but with neutral expressions have been presented in FAHO. This additional task lasts 4 minutes.  ", "expAdditionalRemarks": null },
  { "expId": 87, "expCohort": 0, "expWave": 4, "expType": 3, "expSubject": 0, "expName": 40, "expInfo": "To understand how the developing brain differentially responds to viewing pictures of faces vs. houses. Infants or children up to the age of 6 passively watch pictures of (neutral) faces (12 faces repeated four times) and pictures of typical Dutch houses (also 12 x 4) while we measure their EEG. This task lasts 4 minutes.  ", "expAdditionalRemarks": null },
  { "expId": 88, "expCohort": 0, "expWave": 4, "expType": 5, "expSubject": 0, "expName": 56, "expInfo": "One of the key research findings that make humans an extraordinary social species is that human faces, above anything else, grab and hold our attention. In adults the power of faces has been widely demonstrated. But already in infancy this interest in faces is apparent. For instance, when six-month-olds see an array of items, their first fixations fall more often than expected by chance on the only face (Gliga, Elsabbagh, Andravizou & Johnson, 2009). This phenomenon is known as the face pop-out - phenomenon. The current experiment is a shortened version of this face -pop out experiment (Gliga et al, 2009 Exp1; Elsabbagh et al., 2013): it is a free viewing experiment in which children from the Baby&Kind cohort are presented with multiple five-item arrays (always: 1. Human face; 2. Car; 3. Mobile phone; 4. Bird; 5; Face-shaped noise figure). It tests whether children automatically orient to faces and whether they prefer to look at faces (i.e. look disproportionally longer to faces). ", "expAdditionalRemarks": null },
  { "expId": 89, "expCohort": 0, "expWave": 4, "expType": 5, "expSubject": 0, "expName": 57, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation.\u00a0 Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": null },
  { "expId": 90, "expCohort": 0, "expWave": 4, "expType": 5, "expSubject": 0, "expName": 58, "expInfo": "The social gaze task is an eye-tracking task at all waves (except pregnancy) that measures a subject's sensitivity to another person's gaze direction as a possible cue to predict the location of a next event. Sensitivity to gaze direction is taken as a marker of social competence. In a trial, children see a face with direct gaze, followed by an eye gaze shift to one side, followed by a small object ('target') that appears on the cued side or the opposite side. The dependent variable is the latency with which the child detects the target. Generally, people detect targets on the cued side faster than targets on the opposite side. The reaction time differences between cued and opposite-side targets have been taken to reflect better social skill.", "expAdditionalRemarks": null },
  { "expId": 91, "expCohort": 0, "expWave": 4, "expType": 9, "expSubject": 2, "expName": 80, "expInfo": "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (clean-up and a teaching task), and a pleasant event (unstructured free play). The PCI tasks take about 15 minutes to complete.", "expAdditionalRemarks": null },
  { "expId": 92, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 3, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 93, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 3, "expName": 41, "expInfo": "Medical & Psychiatric problems of first degree family members", "expAdditionalRemarks": "From R0-10m onwards only psychiatric family background" },
  { "expId": 94, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 3, "expName": 52, "expInfo": "General health questionnaire", "expAdditionalRemarks": null },
  { "expId": 95, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 3, "expName": 68, "expInfo": "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 96, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 3, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 97, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 3, "expName": 114, "expInfo": "Work demographics", "expAdditionalRemarks": null },
  { "expId": 98, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 5, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 99, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 5, "expName": 41, "expInfo": "Medical & Psychiatric problems of first degree family members", "expAdditionalRemarks": "From R0-10m onwards only psychiatric family background" },
  { "expId": 100, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 5, "expName": 52, "expInfo": "General health questionnaire", "expAdditionalRemarks": null },
  { "expId": 101, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 5, "expName": 68, "expInfo": "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", "expAdditionalRemarks": null },
  { "expId": 102, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 5, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 103, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 5, "expName": 114, "expInfo": "Work demographics", "expAdditionalRemarks": null },
  { "expId": 104, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 2, "expInfo": "Ages and Stages Questionnaire - Social Emotional (ASQ-SE)", "expAdditionalRemarks": null },
  { "expId": 105, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 4, "expInfo": "Length, head circumference, weight and vaccinations", "expAdditionalRemarks": null },
  { "expId": 106, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 13, "expInfo": "Rothbart's Temperament Questionnaire (IBQ-R SF, ECBQ-SF, CBQ-SF, TMCQ) - subscales: Perceptual Sensitivity, Low Intensity Pleasure, Attentional Focussing, Inhibitory control, Impulsivity (only in Around 6)", "expAdditionalRemarks": null },
  { "expId": 107, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 18, "expInfo": "Medical questionnaire on child's health and Gender Identity (GI)", "expAdditionalRemarks": null },
  { "expId": 108, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 24, "expInfo": "Comprehensive Early Childhood Parenting Questionnaire (CECPAQ)", "expAdditionalRemarks": null },
  { "expId": 109, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 30, "expInfo": "Daily care of the child", "expAdditionalRemarks": null },
  { "expId": 110, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 45, "expInfo": "Food Frequency Questionnaire (FFQ)", "expAdditionalRemarks": null },
  { "expId": 111, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 63, "expInfo": "Nederlandse - Communicative Development Inventories (N-CDI-1, N-CDI-2)", "expAdditionalRemarks": "Some adjustments made by Caroline Junge and Inge Zink - translation from some Flemish words to Dutch. " },
  { "expId": 112, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 64, "expInfo": "Spoken language in child's environment", "expAdditionalRemarks": "In R3 and R6 these questions are part of YBQUEPCCLFB" },
  { "expId": 113, "expCohort": 0, "expWave": 4, "expType": 10, "expSubject": 7, "expName": 83, "expInfo": "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", "expAdditionalRemarks": null },
  { "expId": 114, "expCohort": 0, "expWave": 5, "expType": 11, "expSubject": 0, "expName": 32, "expInfo": "Gender and age of child are withdrawn from the participant registration system. Age of the child is calculated in weeks: difference in experiment date and date of birth rounded down in whole weeks", "expAdditionalRemarks": null },
  { "expId": 115, "expCohort": 0, "expWave": 5, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 116, "expCohort": 0, "expWave": 5, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 117, "expCohort": 0, "expWave": 5, "expType": 0, "expSubject": 0, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 118, "expCohort": 0, "expWave": 5, "expType": 0, "expSubject": 0, "expName": 53, "expInfo": "Approximately 200 strings of hair  cut from the back of the head of the participant as close as possible to the skin, stored in  special envelopes in  fire  proof cabinets", "expAdditionalRemarks": "27-06-2019: stopped collecting hair at 10m due to poor data quality." },
  { "expId": 119, "expCohort": 0, "expWave": 5, "expType": 1, "expSubject": 0, "expName": 67, "expInfo": "The body measures length and weight are measured in centimeters and kilo's respectively.", "expAdditionalRemarks": null },
  { "expId": 120, "expCohort": 0, "expWave": 5, "expType": 2, "expSubject": 0, "expName": 87, "expInfo": "The Peabody picture vocabulary task (PPVT) is a widely used task to measure a person's receptive vocabulary, originally designed by Lloyd Dunn and Leota Dunn (Dunn, Dunn, Bulheller, & H\u00e4cker, 1965). The task used in YOUth follows the Dutch adaptation: Peabody Picture Vocabulary Test-III-NL ('PPVT 3-NL', Schlichting, 2004). We have adapted it to a touvh screen version, with prerecorded spoken words.. This tasks lasts approximately 15 minutes (until the task makes becomes too difficult).", "expAdditionalRemarks": null },
  { "expId": 121, "expCohort": 0, "expWave": 5, "expType": 3, "expSubject": 0, "expName": 23, "expInfo": "This task serves two purposes: first, to observe how the developing brain signal decomposes into separate frequency bands as a function of what the child sees; second: to understand how the connectivity among different areas of the developing brain develops.Infants passively watch 60-second video clips depicting singing women or moving toys while we measure their EEG. This task lasts 3 minutes.Stimuli were two sets of videos. One is a set of 'non-social' videos depicting moving toys without human interference, earlier used in a study by Jones and colleagues (Developmental changes in infant brain activity during naturalistic social experiences. Developmental Psychobiology, 57(7; 2015)). The other is a set of 'social' videos depicting singing women (Dutch stimuli created by Sabine Hunnius and colleagues). Both sets are 60 seconds long.", "expAdditionalRemarks": null },
  { "expId": 122, "expCohort": 0, "expWave": 5, "expType": 3, "expSubject": 0, "expName": 39, "expInfo": "To understand how the developing brain differentially responds to viewing faces with different facial expressions (happy and fear). Young children (from 10 months onwards) passively watch pictures of happy or fearful faces while we measure their EEG. Note that the same faces but with neutral expressions have been presented in FAHO. This additional task lasts 4 minutes.  ", "expAdditionalRemarks": null },
  { "expId": 123, "expCohort": 0, "expWave": 5, "expType": 3, "expSubject": 0, "expName": 40, "expInfo": "To understand how the developing brain differentially responds to viewing pictures of faces vs. houses. Infants or children up to the age of 6 passively watch pictures of (neutral) faces (12 faces repeated four times) and pictures of typical Dutch houses (also 12 x 4) while we measure their EEG. This task lasts 4 minutes.  ", "expAdditionalRemarks": null },
  { "expId": 124, "expCohort": 0, "expWave": 5, "expType": 5, "expSubject": 0, "expName": 56, "expInfo": "One of the key research findings that make humans an extraordinary social species is that human faces, above anything else, grab and hold our attention. In adults the power of faces has been widely demonstrated. But already in infancy this interest in faces is apparent. For instance, when six-month-olds see an array of items, their first fixations fall more often than expected by chance on the only face (Gliga, Elsabbagh, Andravizou & Johnson, 2009). This phenomenon is known as the face pop-out - phenomenon. The current experiment is a shortened version of this face -pop out experiment (Gliga et al, 2009 Exp1; Elsabbagh et al., 2013): it is a free viewing experiment in which children from the Baby&Kind cohort are presented with multiple five-item arrays (always: 1. Human face; 2. Car; 3. Mobile phone; 4. Bird; 5; Face-shaped noise figure). It tests whether children automatically orient to faces and whether they prefer to look at faces (i.e. look disproportionally longer to faces). ", "expAdditionalRemarks": null },
  { "expId": 125, "expCohort": 0, "expWave": 5, "expType": 5, "expSubject": 0, "expName": 57, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation.\u00a0 Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": null },
  { "expId": 126, "expCohort": 0, "expWave": 5, "expType": 5, "expSubject": 0, "expName": 58, "expInfo": "The social gaze task is an eye-tracking task at all waves (except pregnancy) that measures a subject's sensitivity to another person's gaze direction as a possible cue to predict the location of a next event. Sensitivity to gaze direction is taken as a marker of social competence. In a trial, children see a face with direct gaze, followed by an eye gaze shift to one side, followed by a small object ('target') that appears on the cued side or the opposite side. The dependent variable is the latency with which the child detects the target. Generally, people detect targets on the cued side faster than targets on the opposite side. The reaction time differences between cued and opposite-side targets have been taken to reflect better social skill.", "expAdditionalRemarks": null },
  { "expId": 127, "expCohort": 0, "expWave": 5, "expType": 5, "expSubject": 0, "expName": 72, "expInfo": "This eye tracking task is a simplified version of a visual world paradigm, in which every trial presents pairs of familiar images/objects of roughly the same size (example: a chair and a bath), accompanied with a pre-recorded Dutch sentence that asks the participant to look at one of these images (e.g., 'where is a chair?'). This paradigm - known as \"looking while listening\" - is developed by Anne Fernald (cf. Fernald, Zangl, Pottillo & Marchman, 2008). Note that we collect the data using an eye tracker (Tobii TX 300Hz), which measure gaze direction objectively, as opposed to video recordings of subject's eye movements. ", "expAdditionalRemarks": null },
  { "expId": 128, "expCohort": 0, "expWave": 5, "expType": 9, "expSubject": 2, "expName": 80, "expInfo": "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (clean-up and a teaching task), and a pleasant event (unstructured free play). The PCI tasks take about 15 minutes to complete.", "expAdditionalRemarks": null },
  { "expId": 129, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 3, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 130, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 3, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 131, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 3, "expName": 41, "expInfo": "Medical & Psychiatric problems of first degree family members", "expAdditionalRemarks": "From R0-10m onwards only psychiatric family background" },
  { "expId": 132, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 3, "expName": 68, "expInfo": "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 133, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 3, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 134, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 3, "expName": 114, "expInfo": "Work demographics", "expAdditionalRemarks": null },
  { "expId": 135, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 5, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 136, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 5, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 137, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 5, "expName": 41, "expInfo": "Medical & Psychiatric problems of first degree family members", "expAdditionalRemarks": "From R0-10m onwards only psychiatric family background" },
  { "expId": 138, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 5, "expName": 68, "expInfo": "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", "expAdditionalRemarks": null },
  { "expId": 139, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 5, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 140, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 5, "expName": 114, "expInfo": "Work demographics", "expAdditionalRemarks": null },
  { "expId": 141, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 2, "expInfo": "Ages and Stages Questionnaire - Social Emotional (ASQ-SE)", "expAdditionalRemarks": null },
  { "expId": 142, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 4, "expInfo": "Length, head circumference, weight and vaccinations", "expAdditionalRemarks": null },
  { "expId": 143, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 12, "expInfo": "Child Behavior Checklist (CBCL 1.5-5 years, CBCL 6-18 years). Questionnaire about problem behavior and skills of the child", "expAdditionalRemarks": null },
  { "expId": 144, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 13, "expInfo": "Rothbart's Temperament Questionnaire (IBQ-R SF, ECBQ-SF, CBQ-SF, TMCQ) - subscales: Perceptual Sensitivity, Low Intensity Pleasure, Attentional Focussing, Inhibitory control, Impulsivity (only in Around 6)", "expAdditionalRemarks": null },
  { "expId": 145, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 18, "expInfo": "Medical questionnaire on child's health and Gender Identity (GI)", "expAdditionalRemarks": null },
  { "expId": 146, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 24, "expInfo": "Comprehensive Early Childhood Parenting Questionnaire (CECPAQ)", "expAdditionalRemarks": null },
  { "expId": 147, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 30, "expInfo": "Daily care of the child", "expAdditionalRemarks": null },
  { "expId": 148, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 45, "expInfo": "Food Frequency Questionnaire (FFQ)", "expAdditionalRemarks": null },
  { "expId": 149, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 61, "expInfo": "Interpersonal Reactivity Index (IRI) - subscales: Empathic concern (EC), Perspective taking (PT)", "expAdditionalRemarks": null },
  { "expId": 150, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 63, "expInfo": "Nederlandse - Communicative Development Inventories (N-CDI-1, N-CDI-2)", "expAdditionalRemarks": "Some adjustments made by Caroline Junge and Inge Zink - translation from some Flemish words to Dutch. " },
  { "expId": 151, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 65, "expInfo": "Clinical Evaluation of Language Fundamentals Preschool - subscale Pragmatics (CELF - Preschool-2-NL-Pragmatics) and Clinical Evaluation of Language Fundamentals 4th Edition - subscale Pragmatics (CELF-4-NL-pragmatics)", "expAdditionalRemarks": null },
  { "expId": 152, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 66, "expInfo": "Sports and hobbies created by GenerationR", "expAdditionalRemarks": null },
  { "expId": 153, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 75, "expInfo": "Use of apps, television,  games and books", "expAdditionalRemarks": null },
  { "expId": 154, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 83, "expInfo": "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", "expAdditionalRemarks": null },
  { "expId": 155, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 105, "expInfo": "Strengths and difficulties questionnaire (SDQ)  - Subscales: Prosocial, Peer problems", "expAdditionalRemarks": "R3 start sending from september 2019, will replace YBQUEPCITSE" },
  { "expId": 156, "expCohort": 0, "expWave": 5, "expType": 10, "expSubject": 7, "expName": 107, "expInfo": "The Infant-Toddler Social & Emotional Assessment-Revised (ITSEA) - subscales: Empathy, Pro-social", "expAdditionalRemarks": "Stopped fom september 2019, replaced by YBQUEPCSDQY" },
  { "expId": 157, "expCohort": 0, "expWave": 5, "expType": 12, "expSubject": 0, "expName": 31, "expInfo": "The delay of gratification paradigm tests a child's ability to refrain from touching a gift that is placed in front of them, while the experimenter leaves the room.", "expAdditionalRemarks": null },
  { "expId": 158, "expCohort": 0, "expWave": 5, "expType": 12, "expSubject": 0, "expName": 54, "expInfo": "The Hand game aims to measure non-verbal inhibitory control in children aged 3 to 5.", "expAdditionalRemarks": null },
  { "expId": 159, "expCohort": 0, "expWave": 6, "expType": 11, "expSubject": 0, "expName": 32, "expInfo": "Gender and age of child are withdrawn from the participant registration system. Age of the child is calculated in weeks: difference in experiment date and date of birth rounded down in whole weeks", "expAdditionalRemarks": null },
  { "expId": 160, "expCohort": 0, "expWave": 6, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 161, "expCohort": 0, "expWave": 6, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 162, "expCohort": 0, "expWave": 6, "expType": 0, "expSubject": 0, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 163, "expCohort": 0, "expWave": 6, "expType": 0, "expSubject": 0, "expName": 53, "expInfo": "Approximately 200 strings of hair  cut from the back of the head of the participant as close as possible to the skin, stored in  special envelopes in  fire  proof cabinets", "expAdditionalRemarks": "27-06-2019: stopped collecting hair at 10m due to poor data quality." },
  { "expId": 164, "expCohort": 0, "expWave": 6, "expType": 1, "expSubject": 0, "expName": 67, "expInfo": "The body measures length and weight are measured in centimeters and kilo's respectively.", "expAdditionalRemarks": null },
  { "expId": 165, "expCohort": 0, "expWave": 6, "expType": 2, "expSubject": 0, "expName": 59, "expInfo": "The Stop Signal Anticipation task is adopted from Zandbelt and Vink (Vink et al., 2014, Zandbelt et al., 2008) and is also used as MRI task in YOUth child and teenager (METC 14-617). The Stop Signal Anticipation task measures response inhibition, which is considered an important aspect of behavioral control. Children will be instructed to stop a moving bar at a specific location (go trials) by pressing a specific response box button. In some trials, the bar stops moving (stop signal) and the participants need to inhibit their response. A cue at the beginning of the trial indicates the probability that the bar will stop. The onset of the stop signal will vary from one trial to the next according to\na staircase procedure that is dependent on the participant\u2019s response time (Zandbelt et al., 2008). The children will be trained prior to the task to ensure that they understand the instructions. The training takes approximately 5 minutes, task duration is 10 minutes.", "expAdditionalRemarks": null },
  { "expId": 166, "expCohort": 0, "expWave": 6, "expType": 2, "expSubject": 0, "expName": 87, "expInfo": "The Peabody picture vocabulary task (PPVT) is a widely used task to measure a person's receptive vocabulary, originally designed by Lloyd Dunn and Leota Dunn (Dunn, Dunn, Bulheller, & H\u00e4cker, 1965). The task used in YOUth follows the Dutch adaptation: Peabody Picture Vocabulary Test-III-NL ('PPVT 3-NL', Schlichting, 2004). We have adapted it to a touvh screen version, with prerecorded spoken words.. This tasks lasts approximately 15 minutes (until the task makes becomes too difficult).", "expAdditionalRemarks": null },
  { "expId": 167, "expCohort": 0, "expWave": 6, "expType": 2, "expSubject": 0, "expName": 108, "expInfo": "The internationally widely used Theory of Mind Scale (ToM Scale; Wellman & Liu, 2004), a measure of social competence, measures the ability of young children to attribute mental states (e.g. beliefs, goals, desires, emotions) to other people, and to understand and predict their behavior as a function of those states. The ToM Scale consists of five tasks that increase in difficulty.", "expAdditionalRemarks": null },
  { "expId": 168, "expCohort": 0, "expWave": 6, "expType": 3, "expSubject": 0, "expName": 23, "expInfo": "This task serves two purposes: first, to observe how the developing brain signal decomposes into separate frequency bands as a function of what the child sees; second: to understand how the connectivity among different areas of the developing brain develops.Infants passively watch 60-second video clips depicting singing women or moving toys while we measure their EEG. This task lasts 3 minutes.Stimuli were two sets of videos. One is a set of 'non-social' videos depicting moving toys without human interference, earlier used in a study by Jones and colleagues (Developmental changes in infant brain activity during naturalistic social experiences. Developmental Psychobiology, 57(7; 2015)). The other is a set of 'social' videos depicting singing women (Dutch stimuli created by Sabine Hunnius and colleagues). Both sets are 60 seconds long.", "expAdditionalRemarks": null },
  { "expId": 169, "expCohort": 0, "expWave": 6, "expType": 3, "expSubject": 0, "expName": 39, "expInfo": "To understand how the developing brain differentially responds to viewing faces with different facial expressions (happy and fear). Young children (from 10 months onwards) passively watch pictures of happy or fearful faces while we measure their EEG. Note that the same faces but with neutral expressions have been presented in FAHO. This additional task lasts 4 minutes.  ", "expAdditionalRemarks": null },
  { "expId": 170, "expCohort": 0, "expWave": 6, "expType": 3, "expSubject": 0, "expName": 40, "expInfo": "To understand how the developing brain differentially responds to viewing pictures of faces vs. houses. Infants or children up to the age of 6 passively watch pictures of (neutral) faces (12 faces repeated four times) and pictures of typical Dutch houses (also 12 x 4) while we measure their EEG. This task lasts 4 minutes.  ", "expAdditionalRemarks": null },
  { "expId": 171, "expCohort": 0, "expWave": 6, "expType": 5, "expSubject": 0, "expName": 14, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation. This task can have a prosaccade instruction (i.e., look at the peripheral stimulus) and an antisaccade instruction (i.e., look at the opposite direction of where the stimulus appears). The antisaccade instruction more strongly reflects attentional inhibition. Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": null },
  { "expId": 172, "expCohort": 0, "expWave": 6, "expType": 5, "expSubject": 0, "expName": 56, "expInfo": "One of the key research findings that make humans an extraordinary social species is that human faces, above anything else, grab and hold our attention. In adults the power of faces has been widely demonstrated. But already in infancy this interest in faces is apparent. For instance, when six-month-olds see an array of items, their first fixations fall more often than expected by chance on the only face (Gliga, Elsabbagh, Andravizou & Johnson, 2009). This phenomenon is known as the face pop-out - phenomenon. The current experiment is a shortened version of this face -pop out experiment (Gliga et al, 2009 Exp1; Elsabbagh et al., 2013): it is a free viewing experiment in which children from the Baby&Kind cohort are presented with multiple five-item arrays (always: 1. Human face; 2. Car; 3. Mobile phone; 4. Bird; 5; Face-shaped noise figure). It tests whether children automatically orient to faces and whether they prefer to look at faces (i.e. look disproportionally longer to faces). ", "expAdditionalRemarks": null },
  { "expId": 173, "expCohort": 0, "expWave": 6, "expType": 5, "expSubject": 0, "expName": 57, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation.\u00a0 Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": null },
  { "expId": 174, "expCohort": 0, "expWave": 6, "expType": 5, "expSubject": 0, "expName": 58, "expInfo": "The social gaze task is an eye-tracking task at all waves (except pregnancy) that measures a subject's sensitivity to another person's gaze direction as a possible cue to predict the location of a next event. Sensitivity to gaze direction is taken as a marker of social competence. In a trial, children see a face with direct gaze, followed by an eye gaze shift to one side, followed by a small object ('target') that appears on the cued side or the opposite side. The dependent variable is the latency with which the child detects the target. Generally, people detect targets on the cued side faster than targets on the opposite side. The reaction time differences between cued and opposite-side targets have been taken to reflect better social skill.", "expAdditionalRemarks": null },
  { "expId": 175, "expCohort": 0, "expWave": 6, "expType": 6, "expSubject": 0, "expName": 113, "expInfo": "Intelligence will be estimated with the Wechsler Preschool and Primary Scale of Intelligence in the third edition (WPPSI-III Dutch Version, Weschler, 2010). We will assess seven (core) substests.", "expAdditionalRemarks": null },
  { "expId": 176, "expCohort": 0, "expWave": 6, "expType": 9, "expSubject": 2, "expName": 80, "expInfo": "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (clean-up and a teaching task), and a pleasant event (unstructured free play). The PCI tasks take about 15 minutes to complete.", "expAdditionalRemarks": null },
  { "expId": 177, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 3, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 178, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 3, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 179, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 3, "expName": 41, "expInfo": "Medical & Psychiatric problems of first degree family members", "expAdditionalRemarks": "From R0-10m onwards only psychiatric family background" },
  { "expId": 180, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 3, "expName": 68, "expInfo": "Medication, exposure prior to pregnancy, alcohol, smoking, substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 181, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 3, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 182, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 3, "expName": 114, "expInfo": "Work demographics", "expAdditionalRemarks": null },
  { "expId": 183, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 5, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 184, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 5, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 0 onwards)", "expAdditionalRemarks": null },
  { "expId": 185, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 5, "expName": 41, "expInfo": "Medical & Psychiatric problems of first degree family members", "expAdditionalRemarks": "From R0-10m onwards only psychiatric family background" },
  { "expId": 186, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 5, "expName": 68, "expInfo": "Vitamins, medication, exposure during pregnancy, alcohol, smoking, substance (ab)use, physical activity, sleep (PSQI)", "expAdditionalRemarks": null },
  { "expId": 187, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 5, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 188, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 5, "expName": 114, "expInfo": "Work demographics", "expAdditionalRemarks": null },
  { "expId": 189, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 4, "expInfo": "Length, head circumference, weight and vaccinations", "expAdditionalRemarks": null },
  { "expId": 190, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 8, "expInfo": "Bullying behavior of/towards the child", "expAdditionalRemarks": null },
  { "expId": 191, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 11, "expInfo": "Quick Big Five (QBF)", "expAdditionalRemarks": null },
  { "expId": 192, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 12, "expInfo": "Child Behavior Checklist (CBCL 1.5-5 years, CBCL 6-18 years). Questionnaire about problem behavior and skills of the child", "expAdditionalRemarks": null },
  { "expId": 193, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 13, "expInfo": "Rothbart's Temperament Questionnaire (IBQ-R SF, ECBQ-SF, CBQ-SF, TMCQ) - subscales: Perceptual Sensitivity, Low Intensity Pleasure, Attentional Focussing, Inhibitory control, Impulsivity (only in Around 6)", "expAdditionalRemarks": null },
  { "expId": 194, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 18, "expInfo": "Medical questionnaire on child's health and Gender Identity (GI)", "expAdditionalRemarks": null },
  { "expId": 195, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 22, "expInfo": "Short version of the Children's Sleep Habit Questionnaire (CSHQ)", "expAdditionalRemarks": null },
  { "expId": 196, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 24, "expInfo": "Comprehensive Early Childhood Parenting Questionnaire (CECPAQ)", "expAdditionalRemarks": null },
  { "expId": 197, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 30, "expInfo": "Daily care of the child", "expAdditionalRemarks": null },
  { "expId": 198, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 45, "expInfo": "Food Frequency Questionnaire (FFQ)", "expAdditionalRemarks": null },
  { "expId": 199, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 51, "expInfo": "Gender identity questionnaire", "expAdditionalRemarks": "This is a more extensive measure of GI compared to the GI measured in YBQUEPCCHHB, because the questions used in YBQUEPCCHHB are also used in Child & Adolescent, both measures are used in Around 6" },
  { "expId": 200, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 61, "expInfo": "Interpersonal Reactivity Index (IRI) - subscales: Empathic concern (EC), Perspective taking (PT)", "expAdditionalRemarks": null },
  { "expId": 201, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 65, "expInfo": "Clinical Evaluation of Language Fundamentals Preschool - subscale Pragmatics (CELF - Preschool-2-NL-Pragmatics) and Clinical Evaluation of Language Fundamentals 4th Edition - subscale Pragmatics (CELF-4-NL-pragmatics)", "expAdditionalRemarks": null },
  { "expId": 202, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 66, "expInfo": "Sports and hobbies created by GenerationR", "expAdditionalRemarks": null },
  { "expId": 203, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 75, "expInfo": "Use of apps, television,  games and books", "expAdditionalRemarks": null },
  { "expId": 204, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 83, "expInfo": "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", "expAdditionalRemarks": null },
  { "expId": 205, "expCohort": 0, "expWave": 6, "expType": 10, "expSubject": 7, "expName": 105, "expInfo": "Strengths and difficulties questionnaire (SDQ)  - Subscales: Prosocial, Peer problems", "expAdditionalRemarks": "R3 start sending from september 2019, will replace YBQUEPCITSE" },
  { "expId": 206, "expCohort": 0, "expWave": 7, "expType": 11, "expSubject": 0, "expName": 32, "expInfo": "Gender and age of child are withdrawn from the participant registration system. Age of the child is calculated in months: difference in experiment date and date of birth rounded down in whole months", "expAdditionalRemarks": null },
  { "expId": 207, "expCohort": 0, "expWave": 7, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 208, "expCohort": 0, "expWave": 7, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 209, "expCohort": 1, "expWave": 7, "expType": 0, "expSubject": 0, "expName": 5, "expInfo": " 20 mL serum and 10 mL EDTA-plasma collected through venapunction, stored in 12 aliquots of serum, 6 aliquots of plasma and 3 aliquots of cell pellets, in 900 micro L containers at -80 oC", "expAdditionalRemarks": null },
  { "expId": 210, "expCohort": 1, "expWave": 7, "expType": 0, "expSubject": 0, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 211, "expCohort": 1, "expWave": 7, "expType": 0, "expSubject": 0, "expName": 53, "expInfo": "Approximately 200 strings of hair  cut from the back of the head of the participant as close as possible to the skin, stored in special envelopes in fire proof cabinets", "expAdditionalRemarks": null },
  { "expId": 212, "expCohort": 1, "expWave": 7, "expType": 0, "expSubject": 0, "expName": 100, "expInfo": "We ask the children to collect saliva at home 30 min after waking up. Girls that have had their menarche are asked to collect the saliva at the 7th day of their cycle (counting from the first day of menstruation). ", "expAdditionalRemarks": null },
  { "expId": 213, "expCohort": 1, "expWave": 7, "expType": 0, "expSubject": 3, "expName": 5, "expInfo": "10 mL EDTA-plasma collected through venapunction, stored in 3 aliquots of cell pellets in 900 micro L containers at -80 oC", "expAdditionalRemarks": null },
  { "expId": 214, "expCohort": 1, "expWave": 7, "expType": 0, "expSubject": 3, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s, stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 215, "expCohort": 1, "expWave": 7, "expType": 0, "expSubject": 5, "expName": 5, "expInfo": "10 mL EDTA-plasma collected through venapunction, stored in 3 aliquots of cell pellets in 900 micro L containers at -80 oC", "expAdditionalRemarks": null },
  { "expId": 216, "expCohort": 1, "expWave": 7, "expType": 0, "expSubject": 5, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 217, "expCohort": 1, "expWave": 7, "expType": 1, "expSubject": 0, "expName": 67, "expInfo": "The body measures length and weight are measured in centimeters and kilo's respectively.", "expAdditionalRemarks": null },
  { "expId": 218, "expCohort": 1, "expWave": 7, "expType": 2, "expSubject": 0, "expName": 29, "expInfo": "This paradigm measures constructs of prosocial behavior related to empathy as it investigates whether a child actively compensates for other children's behavior who are suddenly excluding a third child in a 4-personsball-throwing game", "expAdditionalRemarks": null },
  { "expId": 219, "expCohort": 1, "expWave": 7, "expType": 2, "expSubject": 0, "expName": 33, "expInfo": "The delay discounting task is typically considered an index of impulsive behaviour. Children are asked to make a choice between an immediate small reward and a delayed larger reward.", "expAdditionalRemarks": null },
  { "expId": 220, "expCohort": 1, "expWave": 7, "expType": 2, "expSubject": 0, "expName": 88, "expInfo": "The Peabody picture vocabulary task (PPVT) is a widely used task to measure a person's receptive vocabulary, originally designed by Lloyd Dunn and Leota Dunn (Dunn, Dunn, Bulheller, & H\u00e4cker, 1965). The task used in YOUth follows the Dutch adaptation: Peabody Picture Vocabulary Test-III-NL ('PPVT 3-NL', Schlichting, 2004). We have adapted it to a computer task, with prerecorded spoken words. This tasks lasts approximately 15 minutes (until the task becomes too difficult).", "expAdditionalRemarks": null },
  { "expId": 221, "expCohort": 1, "expWave": 7, "expType": 2, "expSubject": 0, "expName": 89, "expInfo": "The Penn CNB is a computerized neurocognitive battery developed by the Brain Behavior Laboratory of the University of Pennsylvania (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). The web-based Penn CNB is made available to administer online (https://penncnp.med.upenn.edu/). The battery quantifies cognitive functioning in different domains that link to specific brain systems, based on functional neuroimaging studies. Importantly, the latest version of the Penn CNB is able to detect age and sex differences in a population-based sample of 3500 (pre-)adolescents between 8 and 21 years old (Gur et al., 2012). The web-based Penn CNB is translated in Dutch and validated in a sample of 1140 participants between 10 and 86 years old (Swagerman et al., 2016). Social cognition is measured with the 40-item Emotion Recognition task (Gur et al., 2002; Gur et al., 2012). In the task pictures of faces are presented one by one. The faces are either neutral or display an emotional expression: happy, sad, anger or fear. The children are asked to choose the expressed emotion in a multiple- choice format (\"happy\", \"sad\", \"anger\", \"fear\", \"no emotion\"). Response time and accuracy are measured. The child can practice one trial where feedback is provided until the right answer is given.", "expAdditionalRemarks": "The PENN task will be distributed in a single Excel-file containing one subtest per tab. Data collection via Penn tasks is discontinued as off december 2020." },
  { "expId": 222, "expCohort": 1, "expWave": 7, "expType": 2, "expSubject": 0, "expName": 90, "expInfo": "The Penn CNB is a computerized neurocognitive battery developed by the Brain Behavior Laboratory of the University of Pennsylvania (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). The web-based Penn CNB is made available to administer online (https://penncnp.med.upenn.edu/). The battery quantifies cognitive functioning in different domains that link to specific brain systems, based on functional neuroimaging studies. Importantly, the latest version of the Penn CNB is able to detect age and sex differences in a population-based sample of 3500 (pre-)adolescents between 8 and 21 years old (Gur et al., 2012). The web-based Penn CNB is translated in Dutch and validated in a sample of 1140 participants between 10 and 86 years old (Swagerman et al., 2016). All children start the Penn tasks with the Mouse Practice task that measures sensorimotor speed (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). Children click as quickly as possible on a green square that disappears after the click. The square gets smaller and smaller and reappears at different locations on the screen. The response time measured in this task can be used to correct for differences between children in their ability to move the mouse and click on targets. After the task the administrator can fill in whether the trials are valid with a code and comments. The task starts with some practice trials.", "expAdditionalRemarks": "The PENN task will be distributed in a single Excel-file containing one subtest per tab. Data collection via Penn tasks is discontinued as off december 2020." },
  { "expId": 223, "expCohort": 1, "expWave": 7, "expType": 2, "expSubject": 0, "expName": 91, "expInfo": "The Penn CNB is a computerized neurocognitive battery developed by the Brain Behavior Laboratory of the University of Pennsylvania (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). The web-based Penn CNB is made available to administer online (https://penncnp.med.upenn.edu/). The battery quantifies cognitive functioning in different domains that link to specific brain systems, based on functional neuroimaging studies. Importantly, the latest version of the Penn CNB is able to detect age and sex differences in a population-based sample of 3500 (pre-)adolescents between 8 and 21 years old (Gur et al., 2012). The web-based Penn CNB is translated in Dutch and validated in a sample of 1140 participants between 10 and 86 years old (Swagerman et al., 2016). Immediate and delayed verbal memory performance is quantified with the Penn Word Memory task (Gur et al., 1997; Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). Children are asked to remember words that are displayed one by one. Next, these target words are mixed with novel words and children are asked to indicate whether they saw each word before (\"certainly\", \"probably\", \"probably not\", \"certainly not\"). Delayed verbal memory is then assessed after a delay of 20 minutes by asking the children again to respond to a new mix of targets words and distractors. Response time and accuracy are measured.", "expAdditionalRemarks": "The PENN task will be distributed in a single Excel-file containing one subtest per tab. Data collection via Penn tasks is discontinued as off december 2020." },
  { "expId": 224, "expCohort": 1, "expWave": 7, "expType": 2, "expSubject": 0, "expName": 92, "expInfo": "The Penn CNB is a computerized neurocognitive battery developed by the Brain Behavior Laboratory of the University of Pennsylvania (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). The web-based Penn CNB is made available to administer online (https://penncnp.med.upenn.edu/). The battery quantifies cognitive functioning in different domains that link to specific brain systems, based on functional neuroimaging studies. Importantly, the latest version of the Penn CNB is able to detect age and sex differences in a population-based sample of 3500 (pre-)adolescents between 8 and 21 years old (Gur et al., 2012). The web-based Penn CNB is translated in Dutch and validated in a sample of 1140 participants between 10 and 86 years old (Swagerman et al., 2016). Immediate and delayed verbal memory performance is quantified with the Penn Word Memory task (Gur et al., 1997; Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). Children are asked to remember words that are displayed one by one. Next, these target words are mixed with novel words and children are asked to indicate whether they saw each word before (\"certainly\", \"probably\", \"probably not\", \"certainly not\"). Delayed verbal memory is then assessed after a delay of 20 minutes by asking the children again to respond to a new mix of targets words and distractors. Response time and accuracy are measured.", "expAdditionalRemarks": "The PENN task will be distributed in a single Excel-file containing one subtest per tab. Data collection via Penn tasks is discontinued as off december 2020." },
  { "expId": 225, "expCohort": 1, "expWave": 7, "expType": 2, "expSubject": 0, "expName": 109, "expInfo": "The trust game (Berg et al., 1995) tests participants' willingness to trust others and reciprocate other's trusts in a social context, both of which serve as proxies for perspective taking. In multiple rounds, participants have the option to divide money between two players in a pre-selected way, or donate money to a shared pot and leave it up to the second player how to divide the money, in which case the total stakes are being tripled. ", "expAdditionalRemarks": null },
  { "expId": 226, "expCohort": 1, "expWave": 7, "expType": 5, "expSubject": 0, "expName": 14, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation. This task can have a prosaccade instruction (i.e., look at the peripheral stimulus) and an antisaccade instruction (i.e., look at the opposite direction of where the stimulus appears). The antisaccade instruction more strongly reflects attentional inhibition. Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": "Eyetracking in this cohort stopped in May 2022" },
  { "expId": 227, "expCohort": 1, "expWave": 7, "expType": 5, "expSubject": 0, "expName": 15, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation. This task can have a prosaccade instruction (i.e., look at the peripheral stimulus) and an antisaccade instruction (i.e., look at the opposite direction of where the stimulus appears). The antisaccade instruction more strongly reflects attentional inhibition. Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": "Eyetracking in this cohort stopped in May 2022" },
  { "expId": 228, "expCohort": 1, "expWave": 7, "expType": 5, "expSubject": 0, "expName": 17, "expInfo": "The social gaze task is an eye-tracking task at all waves (except pregnancy) that measures a subject's sensitivity to another person's gaze direction as a possible cue to predict the location of a next event. Sensitivity to gaze direction is taken as a marker of social competence. In a trial, children see a face with direct gaze, followed by an eye gaze shift to one side, followed by a small object ('target') that appears on the cued side or the opposite side. The dependent variable is the latency with which the child detects the target. Generally, people detect targets on the cued side faster than targets on the opposite side. The reaction time differences between cued and opposite-side targets have been taken to reflect better social skill.", "expAdditionalRemarks": "Eyetracking in this cohort stopped in May 2022" },
  { "expId": 229, "expCohort": 1, "expWave": 7, "expType": 5, "expSubject": 2, "expName": 35, "expInfo": "To study the role of gaze behavior in face-to-face communication between parents and children, we used a dual-eye tracking setup that is capable of concurrently recording eye movements, frontal video, and audio during video-mediated face-to-face interactions. Parent\u2013child dyads engaged in conversations about cooperative and conflictive family topics. Each conversation lasted for approximately 5 minutes (see Holleman et al., 2021, Current Psychology for the published article).", "expAdditionalRemarks": null },
  { "expId": 230, "expCohort": 1, "expWave": 7, "expType": 6, "expSubject": 0, "expName": 111, "expInfo": "Intelligence was estimated with the Wechsler Intelligence Scale for Children in the  third edition (WISC-III Dutch version, Wechsler, 2003) until 2018-04-18. We assessed six subtests of the WISC-III: vocabulary, block design, smiliraties, coding, arithmetic, and digit span.", "expAdditionalRemarks": "WISC III was used until 2018-04-18" },
  { "expId": 231, "expCohort": 1, "expWave": 7, "expType": 6, "expSubject": 0, "expName": 112, "expInfo": "Intelligence is estimated with the Wechsler Intelligence Scale for Children in the fifth edition (WISC-V Dutch version, Wechsler, 2018) from 2018-04-18.  We assess the following seven subtests: vocabulary, block design, similarities, coding, matrix reasoning, figure weights, and digit span. ", "expAdditionalRemarks": "WISC V in use as of 2018-04-18 until May 2022" },
  { "expId": 232, "expCohort": 1, "expWave": 7, "expType": 8, "expSubject": 0, "expName": 60, "expInfo": "Behavioral output file of the inhibition experiment practice run preceding the MRI experiment.", "expAdditionalRemarks": null },
  { "expId": 233, "expCohort": 1, "expWave": 7, "expType": 8, "expSubject": 0, "expName": 76, "expInfo": "Visual scale to assess how excited and how tensed the child feels during the mock MRI experiment.", "expAdditionalRemarks": "vasmock recorded in labjournal" },
  { "expId": 234, "expCohort": 1, "expWave": 7, "expType": 7, "expSubject": 0, "expName": 3, "expInfo": "A T1-weighted 3D fast-field echo scan with the following parameters: 200 0.8 mm contiguous slices; echo time (TE) 4.6 ms; repetition time (TR) 10ms; flip angle 8 degrees; in-plane voxel size 0.75 x 0.75 mm^2. The raw Philips DICOM files were converted to NIfTi format via dcm2niix (v20190112, https://github.com/rordenlab/dcm2niix) using the flag '-p n' (no Philips precise float scaling), and subsequently defaced using mri_deface (v1.22, https://surfer.nmr.mgh.harvard.edu/fswiki/mri_deface), resulting in 4-byte float gzipped NIfTi files.", "expAdditionalRemarks": null },
  { "expId": 235, "expCohort": 1, "expWave": 7, "expType": 7, "expSubject": 0, "expName": 34, "expInfo": "High resolution multi-shell diffusion weighted imaging (DWI) scans with the following parameter settings: 95 different diffusion-weighted directions (15 with b-value 500 s/mm^2, 30 with b-value 1000 s/mm^2, 60 with 2000 s/mm^2 and every 10th scan one diffusion unweighted (b=0) scan); 66 slices; slice thickness = 2 mm (no gap); FOV=224x224 mm; acquisition matrix=112x112; SENSE parallel imaging factor = 1.3; multiband factor 3; TR = 3500 ms; TE = 99 ms; no cardiac gating; total acquisition time = 510 s. In addition, two short (20 s each) DWI scans are acquired (one with a reversed k-space readout) to correct for susceptibility artefacts. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 236, "expCohort": 1, "expWave": 7, "expType": 7, "expSubject": 0, "expName": 46, "expInfo": "Behavioral output file accompanying emotionmriscan.", "expAdditionalRemarks": null },
  { "expId": 237, "expCohort": 1, "expWave": 7, "expType": 7, "expSubject": 0, "expName": 47, "expInfo": "Functional MRI acquired while subjects performed a task. Participants viewed pictures of faces (happy, fearful, or neutral expression) and houses in a pseudorandom order. The stimuli are taken from the Radboud Faces Database (Langner et al., 2010). Stimuli were presented in blocks of 18 seconds, with four blocks for each of the four stimulus types. The scan sequence: using SENSE coil; parallel imaging, sensefactor 1.8; T2* weighted scan; Timeseries 389 scans, single scan duration 1 sec; Scanorientation sagittal; 64x64 acquisition matrix; 51 slices; multiband factor 3; FOV 220 mm; 2.5 mm isotropic voxels; TR/TE 1000/25. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 238, "expCohort": 1, "expWave": 7, "expType": 7, "expSubject": 0, "expName": 48, "expInfo": "Behavioral output file accompanying inhibitionmriscan.", "expAdditionalRemarks": null },
  { "expId": 239, "expCohort": 1, "expWave": 7, "expType": 7, "expSubject": 0, "expName": 49, "expInfo": "Functional MRI acquired while subjects performed a task. Task aims to measure performance and brain activation during actual stopping as well as during the anticipation of stopping. Trials begin with the presentation of a cue (0, * or **), representing the stop-signal probability (0, 22 and 33% respectively). Permanently visible are three horizontal white lines, and goal is to stop a rising bar as close to the middle line as possible (target) by pressing a button, but refrain from pressing the button when the bar stops on its own (stop signal). The scan sequence: SENSE coil; parallel imaging, sensefactor 1.8; T2* weighted scan; Timeseries 595 scans, single scan duration 1 sec; Scanorientation sagittal; 64x64 acquisition matrix; 51 slices; multiband factor 3; FOV = 220 mm; 2.5 mm isotropic voxels; TR/TE 1000/25. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 240, "expCohort": 1, "expWave": 7, "expType": 7, "expSubject": 0, "expName": 76, "expInfo": "Visual scale to assess how excited and how tensed the child feels during the MRI experiment.", "expAdditionalRemarks": "vasmri recorded in labjournal" },
  { "expId": 241, "expCohort": 1, "expWave": 7, "expType": 7, "expSubject": 0, "expName": 99, "expInfo": "Functional MRI acquired while subjects were presented with a white cross on a grey screen. \nThe scan sequence: using SENSE coil; parallel imaging, sensefactor 1.8; 3D T2* weighted scan; Timeseries 480 scans, single scan duration 1 sec; Scanorientation sagittal; 64x64 acquisition matrix; 51 slices; multiband factor 3; FOV = 220 mm; 2.5 mm isotropic voxels; TR/TE1000/25. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 242, "expCohort": 1, "expWave": 7, "expType": 9, "expSubject": 2, "expName": 80, "expInfo": "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", "expAdditionalRemarks": "PCI in this cohort stopped in May 2022" },
  { "expId": 243, "expCohort": 1, "expWave": 7, "expType": 9, "expSubject": 2, "expName": 80, "expInfo": "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", "expAdditionalRemarks": "PCI in this cohort stopped in May 2022" },
  { "expId": 244, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 13, "expInfo": "Rothbart's Temperament Questionnaire (EATQ-R) - Subscales: Attention, Inhibitory control", "expAdditionalRemarks": null },
  { "expId": 245, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 19, "expInfo": "Child's report of parental behavior inventory (CRPBI) - subscale Strictness/Supervision", "expAdditionalRemarks": null },
  { "expId": 246, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 20, "expInfo": "Self-Perception Profile for Adolescents (Competentie belevingsschaal - adolescent; CBSA)", "expAdditionalRemarks": null },
  { "expId": 247, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 55, "expInfo": "Brief Barrat impulsivity scale (Brief-BIS) and risk behavior (substance (ab)use)", "expAdditionalRemarks": null },
  { "expId": 248, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 61, "expInfo": "Interpersonal Reactivity Index (IRI) - subscales: Empathic concern (EC), Perspective taking (PT)", "expAdditionalRemarks": null },
  { "expId": 249, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 75, "expInfo": "Use of (computer) games and social media", "expAdditionalRemarks": null },
  { "expId": 250, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 77, "expInfo": "Fictievragenlijst deel 2 kijkgedrag (FVL): Fiction questionnaire - part 2 movies and series", "expAdditionalRemarks": null },
  { "expId": 251, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 78, "expInfo": "Friendship: Network Relationships Inventory Social Provision Version - Short Form (NRI-SPV-SF)", "expAdditionalRemarks": null },
  { "expId": 252, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 81, "expInfo": "Parental control scale (PCS)", "expAdditionalRemarks": null },
  { "expId": 253, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 95, "expInfo": "Physical Activity Questionnaire (PAQ-C, PAQ-A)", "expAdditionalRemarks": "only in participants included from 07-04-2018 onwards" },
  { "expId": 254, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 97, "expInfo": "Pubertal development scale (PDS)", "expAdditionalRemarks": null },
  { "expId": 255, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 98, "expInfo": "Fictievragenlijst deel 1 leesgedrag (FVL): Fiction questionnaire - part 1 reading behavior", "expAdditionalRemarks": null },
  { "expId": 256, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 0, "expName": 102, "expInfo": "Sleep self report (SSR)", "expAdditionalRemarks": null },
  { "expId": 257, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 258, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 21, "expInfo": "Childhood Trauma Questionnaire (CTQ)", "expAdditionalRemarks": null },
  { "expId": 259, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 25, "expInfo": "Utrechtse Coping Lijst (UCL)", "expAdditionalRemarks": null },
  { "expId": 260, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 12 onwards)", "expAdditionalRemarks": null },
  { "expId": 261, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 42, "expInfo": "Medical problems of first degree family members", "expAdditionalRemarks": null },
  { "expId": 262, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 43, "expInfo": "Psychiatric problems of first degree family members", "expAdditionalRemarks": null },
  { "expId": 263, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 52, "expInfo": "General health questionnaire", "expAdditionalRemarks": null },
  { "expId": 264, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 68, "expInfo": "Substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 265, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 70, "expInfo": "Vitamins, medication, exposure during pregnancy", "expAdditionalRemarks": null },
  { "expId": 266, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 71, "expInfo": "List of longterm stressful life events selected by GenerationR", "expAdditionalRemarks": null },
  { "expId": 267, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 268, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 94, "expInfo": "Personality questionnaire (NEO-FFI-3)", "expAdditionalRemarks": null },
  { "expId": 269, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 96, "expInfo": "Portrait values questionnaire - revised (PVQ-RR)", "expAdditionalRemarks": "stopped dd 28-03-2018" },
  { "expId": 270, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 3, "expName": 103, "expInfo": "Social Responsiveness Scale for Adults (SRS-A)", "expAdditionalRemarks": "stopped dd 28-03-2018" },
  { "expId": 271, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 272, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 21, "expInfo": "Childhood Trauma Questionnaire (CTQ)", "expAdditionalRemarks": null },
  { "expId": 273, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 25, "expInfo": "Utrechtse Coping Lijst (UCL)", "expAdditionalRemarks": null },
  { "expId": 274, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 12 onwards)", "expAdditionalRemarks": null },
  { "expId": 275, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 42, "expInfo": "Medical problems of first degree family members", "expAdditionalRemarks": null },
  { "expId": 276, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 43, "expInfo": "Psychiatric problems of first degree family members", "expAdditionalRemarks": null },
  { "expId": 277, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 52, "expInfo": "General health questionnaire", "expAdditionalRemarks": null },
  { "expId": 278, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 68, "expInfo": "Substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 279, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 69, "expInfo": "Vitamins, medication, exposure during pregnancy", "expAdditionalRemarks": null },
  { "expId": 280, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 71, "expInfo": "List of longterm stressful life events selected by GenerationR", "expAdditionalRemarks": null },
  { "expId": 281, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 282, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 93, "expInfo": "Periconceptual health", "expAdditionalRemarks": null },
  { "expId": 283, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 94, "expInfo": "Personality questionnaire (NEO-FFI-3)", "expAdditionalRemarks": null },
  { "expId": 284, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 96, "expInfo": "Portrait values questionnaire - revised (PVQ-RR)", "expAdditionalRemarks": "stopped dd 28-03-2018" },
  { "expId": 285, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 5, "expName": 103, "expInfo": "Social Responsiveness Scale for Adults (SRS-A)", "expAdditionalRemarks": "stopped dd 28-03-2018" },
  { "expId": 286, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 0, "expInfo": "ADHD symptoms (SWAN rating scale) and Gender Identity (GI)", "expAdditionalRemarks": "SWAN stopped dd  28-03-2018, GI questions moved to YAQUEPCBULL" },
  { "expId": 287, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 8, "expInfo": "Bullying behavior of/towards the child and Gender Identity (GI)", "expAdditionalRemarks": "GI questions added from 28-03-2018 onwards, previously measured in YAQUEPCADHD" },
  { "expId": 288, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 11, "expInfo": "Quick Big Five (QBF)", "expAdditionalRemarks": null },
  { "expId": 289, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 12, "expInfo": "Child Behavior Checklist (CBCL 6-18 years). Questionnaire about problem behavior and skills of the child", "expAdditionalRemarks": null },
  { "expId": 290, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 13, "expInfo": "Rothbart's Temperament Questionnaire (EATQ-R)", "expAdditionalRemarks": null },
  { "expId": 291, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 16, "expInfo": "Medical questionnaire on child's health", "expAdditionalRemarks": null },
  { "expId": 292, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 36, "expInfo": "Food Frequency Questionnaire (FFQ)", "expAdditionalRemarks": "only in participants included from 05-04-2018 onwards" },
  { "expId": 293, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 65, "expInfo": "Spoken language in child's environment and Clinical Evaluation of Language Fundamentals 4th Edition - subscale Pragmatics (CELF-4-NL-pragmatics)", "expAdditionalRemarks": null },
  { "expId": 294, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 74, "expInfo": "Media education", "expAdditionalRemarks": "only in participants included from 05-04-2018 onwards" },
  { "expId": 295, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 79, "expInfo": "Parent-child relation: Network Relationships Inventory Social Provision Version - Short Form - Parent report (NRI-SPV-SF parent report)", "expAdditionalRemarks": null },
  { "expId": 296, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 82, "expInfo": "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Acceptance", "expAdditionalRemarks": "stopped dd 28-03-2018" },
  { "expId": 297, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 83, "expInfo": "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", "expAdditionalRemarks": null },
  { "expId": 298, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 86, "expInfo": "Alabamma Parenting Questionnaire (APQ) - Domain: Corporal punishment; Child-Rearing Questionnaire (Nijmeegse Opvoedvragenlijst (NOV)) - Concept: Responsiveness; Parenting Dimensions Inventory (PDI) - Domain: Consistent disciplining", "expAdditionalRemarks": null },
  { "expId": 299, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 7, "expName": 105, "expInfo": "Strengths and difficulties questionnaire (SDQ) - Subscales: Prosocial, Peer problems", "expAdditionalRemarks": null },
  { "expId": 300, "expCohort": 1, "expWave": 7, "expType": 10, "expSubject": 9, "expName": 106, "expInfo": "Teacher Report Form (TRF). Questionnaire about problem behavior and skills of the child", "expAdditionalRemarks": "Stopped sending dd 18-01-2019" },
  { "expId": 301, "expCohort": 0, "expWave": 8, "expType": 11, "expSubject": 0, "expName": 32, "expInfo": "Gender and age of child are withdrawn from the participant registration system. Age of the child is calculated in months: difference in experiment date and date of birth rounded down in whole months", "expAdditionalRemarks": null },
  { "expId": 302, "expCohort": 0, "expWave": 8, "expType": 11, "expSubject": 5, "expName": 32, "expInfo": "Age of mother is withdrawn from the participant registration system. Age of the mother is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 303, "expCohort": 0, "expWave": 8, "expType": 11, "expSubject": 8, "expName": 32, "expInfo": "Gender and age of partner are withdrawn from the participant registration system. Age of the partner is calculated in years: difference in experiment date and date of birth rounded down in whole years", "expAdditionalRemarks": null },
  { "expId": 304, "expCohort": 1, "expWave": 8, "expType": 0, "expSubject": 0, "expName": 5, "expInfo": " 20 mL serum and 10 mL EDTA-plasma collected through venapunction, stored in 12 aliquots of serum, 6 aliquots of plasma and 3 aliquots of cell pellets, in 900 micro L containers at -80 oC", "expAdditionalRemarks": null },
  { "expId": 305, "expCohort": 1, "expWave": 8, "expType": 0, "expSubject": 0, "expName": 7, "expInfo": "Buccal cells  collected with a swab (Sarstedt forensic swab), by gently rubbing and rotating the swab along the inside of the cheek for 5-10 s. stored at -80 oC.", "expAdditionalRemarks": null },
  { "expId": 306, "expCohort": 1, "expWave": 8, "expType": 0, "expSubject": 0, "expName": 53, "expInfo": "Approximately 200 strings of hair  cut from the back of the head of the participant as close as possible to the skin, stored in special envelopes in fire proof cabinets", "expAdditionalRemarks": null },
  { "expId": 307, "expCohort": 1, "expWave": 8, "expType": 0, "expSubject": 0, "expName": 100, "expInfo": "We ask the children to collect saliva at home 30 min after waking up. Girls that have had their menarche are asked to collect the saliva at the 7th day of their cycle (counting from the first day of menstruation). ", "expAdditionalRemarks": null },
  { "expId": 308, "expCohort": 1, "expWave": 8, "expType": 1, "expSubject": 0, "expName": 67, "expInfo": "The body measures length and weight are measured in centimeters and kilo's respectively.", "expAdditionalRemarks": null },
  { "expId": 309, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 29, "expInfo": "This paradigm measures constructs of prosocial behavior related to empathy as it investigates whether a child actively compensates for other children's behavior who are suddenly excluding a third child in a 4-personsball-throwing game", "expAdditionalRemarks": null },
  { "expId": 310, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 33, "expInfo": "The delay discounting task is typically considered an index of impulsive behaviour. Children are asked to make a choice between an immediate small reward and a delayed larger reward.", "expAdditionalRemarks": null },
  { "expId": 311, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 88, "expInfo": "The Peabody picture vocabulary task (PPVT) is a widely used task to measure a person's receptive vocabulary, originally designed by Lloyd Dunn and Leota Dunn (Dunn, Dunn, Bulheller, & H\u00e4cker, 1965). The task used in YOUth follows the Dutch adaptation: Peabody Picture Vocabulary Test-III-NL ('PPVT 3-NL', Schlichting, 2004). We have adapted it to a computer task, with prerecorded spoken words. This tasks lasts approximately 15 minutes (until the task becomes too difficult).", "expAdditionalRemarks": null },
  { "expId": 312, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 89, "expInfo": "The Penn CNB is a computerized neurocognitive battery developed by the Brain Behavior Laboratory of the University of Pennsylvania (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). The web-based Penn CNB is made available to administer online (https://penncnp.med.upenn.edu/). The battery quantifies cognitive functioning in different domains that link to specific brain systems, based on functional neuroimaging studies. Importantly, the latest version of the Penn CNB is able to detect age and sex differences in a population-based sample of 3500 (pre-)adolescents between 8 and 21 years old (Gur et al., 2012). The web-based Penn CNB is translated in Dutch and validated in a sample of 1140 participants between 10 and 86 years old (Swagerman et al., 2016). Social cognition is measured with the 40-item Emotion Recognition task (Gur et al., 2002; Gur et al., 2012). In the task pictures of faces are presented one by one. The faces are either neutral or display an emotional expression: happy, sad, anger or fear. The children are asked to choose the expressed emotion in a multiple- choice format (\"happy\", \"sad\", \"anger\", \"fear\", \"no emotion\"). Response time and accuracy are measured. The child can practice one trial where feedback is provided until the right answer is given.", "expAdditionalRemarks": "The PENN task will be distributed in a single Excel-file containing one subtest per tab. Data collection via Penn tasks is discontinued as off december 2020." },
  { "expId": 313, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 90, "expInfo": "The Penn CNB is a computerized neurocognitive battery developed by the Brain Behavior Laboratory of the University of Pennsylvania (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). The web-based Penn CNB is made available to administer online (https://penncnp.med.upenn.edu/). The battery quantifies cognitive functioning in different domains that link to specific brain systems, based on functional neuroimaging studies. Importantly, the latest version of the Penn CNB is able to detect age and sex differences in a population-based sample of 3500 (pre-)adolescents between 8 and 21 years old (Gur et al., 2012). The web-based Penn CNB is translated in Dutch and validated in a sample of 1140 participants between 10 and 86 years old (Swagerman et al., 2016). All children start the Penn tasks with the Mouse Practice task that measures sensorimotor speed (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). Children click as quickly as possible on a green square that disappears after the click. The square gets smaller and smaller and reappears at different locations on the screen. The response time measured in this task can be used to correct for differences between children in their ability to move the mouse and click on targets. After the task the administrator can fill in whether the trials are valid with a code and comments. The task starts with some practice trials.", "expAdditionalRemarks": "The PENN task will be distributed in a single Excel-file containing one subtest per tab. Data collection via Penn tasks is discontinued as off december 2020." },
  { "expId": 314, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 91, "expInfo": "The Penn CNB is a computerized neurocognitive battery developed by the Brain Behavior Laboratory of the University of Pennsylvania (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). The web-based Penn CNB is made available to administer online (https://penncnp.med.upenn.edu/). The battery quantifies cognitive functioning in different domains that link to specific brain systems, based on functional neuroimaging studies. Importantly, the latest version of the Penn CNB is able to detect age and sex differences in a population-based sample of 3500 (pre-)adolescents between 8 and 21 years old (Gur et al., 2012). The web-based Penn CNB is translated in Dutch and validated in a sample of 1140 participants between 10 and 86 years old (Swagerman et al., 2016). Immediate and delayed verbal memory performance is quantified with the Penn Word Memory task (Gur et al., 1997; Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). Children are asked to remember words that are displayed one by one. Next, these target words are mixed with novel words and children are asked to indicate whether they saw each word before (\"certainly\", \"probably\", \"probably not\", \"certainly not\"). Delayed verbal memory is then assessed after a delay of 20 minutes by asking the children again to respond to a new mix of targets words and distractors. Response time and accuracy are measured.", "expAdditionalRemarks": "The PENN task will be distributed in a single Excel-file containing one subtest per tab. Data collection via Penn tasks is discontinued as off december 2020." },
  { "expId": 315, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 92, "expInfo": "The Penn CNB is a computerized neurocognitive battery developed by the Brain Behavior Laboratory of the University of Pennsylvania (Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). The web-based Penn CNB is made available to administer online (https://penncnp.med.upenn.edu/). The battery quantifies cognitive functioning in different domains that link to specific brain systems, based on functional neuroimaging studies. Importantly, the latest version of the Penn CNB is able to detect age and sex differences in a population-based sample of 3500 (pre-)adolescents between 8 and 21 years old (Gur et al., 2012). The web-based Penn CNB is translated in Dutch and validated in a sample of 1140 participants between 10 and 86 years old (Swagerman et al., 2016). Immediate and delayed verbal memory performance is quantified with the Penn Word Memory task (Gur et al., 1997; Gur et al., 2001; Gur et al., 2010; Gur et al., 2012). Children are asked to remember words that are displayed one by one. Next, these target words are mixed with novel words and children are asked to indicate whether they saw each word before (\"certainly\", \"probably\", \"probably not\", \"certainly not\"). Delayed verbal memory is then assessed after a delay of 20 minutes by asking the children again to respond to a new mix of targets words and distractors. Response time and accuracy are measured.", "expAdditionalRemarks": "The PENN task will be distributed in a single Excel-file containing one subtest per tab. Data collection via Penn tasks is discontinued as off december 2020." },
  { "expId": 316, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 109, "expInfo": "The trust game (Berg et al., 1995) tests participants' willingness to trust others and reciprocate other's trusts in a social context, both of which serve as proxies for perspective taking. In multiple rounds, participants have the option to divide money between two players in a pre-selected way, or donate money to a shared pot and leave it up to the second player how to divide the money, in which case the total stakes are being tripled. ", "expAdditionalRemarks": null },
  { "expId": 317, "expCohort": 1, "expWave": 8, "expType": 2, "expSubject": 0, "expName": 110, "expInfo": "The Balloon Analogue Risk Task (BART) is a computerized measure of risk-taking behavior. The BART models real-world risk behavior through the concept balancing the potential for reward versus loss. In the task, the participant is presented with a balloon and offered the chance to earn money by pumping the balloon up. Each click causes the balloon to incrementally inflate and money to be added to a counter up until some threshold, at which point the balloon is over inflated and explodes. Each METC 14-617. ABR 51521, Version 6 YOUth ADOLESCENT T1 Amendment Version 6, June 23, 2022 21 of 40 pump confers greater risk, but also a greater potential reward. If the participant chooses to cash-out prior to the balloon exploding then they collect the money earned for that trail, but if balloon explodes earnings for that trial are lost.\nA variant of the task has been created using software for the Oculus Rift Virtual Reality headset. Using this headset, the participant is placed in a large room and stands in front of a table with a balloon and two buttons. Using controllers in each hand, the participant can simply move their hand towards the button to either inflate the balloon or cash-out. There are three different balloon colors: Green, Yellow and Purple. These each have different properties, with the chance of the balloon popping being low, medium, and high - which each pop giving 1, 2 or 5 points, respectively. Goal is to save the most points before the balloons pop, and release them to cash in the points. There are 24 balloons in total, with the colors presented in a pseudo-random sequence (generated once for all participants). The task may take up to 10 minutes (when participants are not yet finished the task is ended at the 10 minute mark).", "expAdditionalRemarks": null },
  { "expId": 318, "expCohort": 1, "expWave": 8, "expType": 5, "expSubject": 0, "expName": 14, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation. This task can have a prosaccade instruction (i.e., look at the peripheral stimulus) and an antisaccade instruction (i.e., look at the opposite direction of where the stimulus appears). The antisaccade instruction more strongly reflects attentional inhibition. Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": "Eyetracking in this cohort stopped in May 2022" },
  { "expId": 319, "expCohort": 1, "expWave": 8, "expType": 5, "expSubject": 0, "expName": 15, "expInfo": "The Gap-overlap task (adapted from Elsabbagh, Fernandes et al. (2013)) is a gaze contingent paradigm that measures visual attention shifting between a central and a peripheral stimulus. This is thought to be a key sub process underlying behavioral control. The Gap-Overlap task contains three conditions; i) Gap, in which the central stimulus disappears 200ms before the appearance of the peripheral target; ii) Baseline, in which the central stimulus disappears simultaneously with the appearance of the peripheral target; iii) Overlap, in which the central stimulus remains on screen during peripheral target presentation. This task can have a prosaccade instruction (i.e., look at the peripheral stimulus) and an antisaccade instruction (i.e., look at the opposite direction of where the stimulus appears). The antisaccade instruction more strongly reflects attentional inhibition. Key dependent variables: Latency to shift attention to the peripheral stimulus in the Gap vs Baseline conditions (Facilitation) and Gap vs Overlap conditions (Disengagement).", "expAdditionalRemarks": "Eyetracking in this cohort stopped in May 2022" },
  { "expId": 320, "expCohort": 1, "expWave": 8, "expType": 5, "expSubject": 0, "expName": 17, "expInfo": "The social gaze task is an eye-tracking task at all waves (except pregnancy) that measures a subject's sensitivity to another person's gaze direction as a possible cue to predict the location of a next event. Sensitivity to gaze direction is taken as a marker of social competence. In a trial, children see a face with direct gaze, followed by an eye gaze shift to one side, followed by a small object ('target') that appears on the cued side or the opposite side. The dependent variable is the latency with which the child detects the target. Generally, people detect targets on the cued side faster than targets on the opposite side. The reaction time differences between cued and opposite-side targets have been taken to reflect better social skill.", "expAdditionalRemarks": "Eyetracking in this cohort stopped in May 2022" },
  { "expId": 321, "expCohort": 1, "expWave": 8, "expType": 6, "expSubject": 0, "expName": 112, "expInfo": "Intelligence is estimated with the Wechsler Intelligence Scale for Children in the fifth edition (WISC-V Dutch version, Wechsler, 2018) from 2018-04-18.  We assess the following seven subtests: vocabulary, block design, similarities, coding, matrix reasoning, figure weights, and digit span. ", "expAdditionalRemarks": "WISC V in use as of 2018-04-18 until May 2022" },
  { "expId": 322, "expCohort": 1, "expWave": 8, "expType": 8, "expSubject": 0, "expName": 60, "expInfo": "Behavioral output file of the inhibition experiment practice run preceding the MRI experiment.", "expAdditionalRemarks": null },
  { "expId": 323, "expCohort": 1, "expWave": 8, "expType": 8, "expSubject": 0, "expName": 76, "expInfo": "Visual scale to assess how excited and how tensed the child feels during the mock MRI experiment.", "expAdditionalRemarks": "vasmock recorded in labjournal" },
  { "expId": 324, "expCohort": 1, "expWave": 8, "expType": 7, "expSubject": 0, "expName": 3, "expInfo": "A T1-weighted 3D fast-field echo scan with the following parameters: 200 0.8 mm contiguous slices; echo time (TE) 4.6 ms; repetition time (TR) 10ms; flip angle 8 degrees; in-plane voxel size 0.75 x 0.75 mm^2. The raw Philips DICOM files were converted to NIfTi format via dcm2niix (v20190112, https://github.com/rordenlab/dcm2niix) using the flag '-p n' (no Philips precise float scaling), and subsequently defaced using mri_deface (v1.22, https://surfer.nmr.mgh.harvard.edu/fswiki/mri_deface), resulting in 4-byte float gzipped NIfTi files.", "expAdditionalRemarks": null },
  { "expId": 325, "expCohort": 1, "expWave": 8, "expType": 7, "expSubject": 0, "expName": 34, "expInfo": "High resolution multi-shell diffusion weighted imaging (DWI) scans with the following parameter settings: 95 different diffusion-weighted directions (15 with b-value 500 s/mm^2, 30 with b-value 1000 s/mm^2, 60 with 2000 s/mm^2 and every 10th scan one diffusion unweighted (b=0) scan); 66 slices; slice thickness = 2 mm (no gap); FOV=224x224 mm; acquisition matrix=112x112; SENSE parallel imaging factor = 1.3; multiband factor 3; TR = 3500 ms; TE = 99 ms; no cardiac gating; total acquisition time = 510 s. In addition, two short (20 s each) DWI scans are acquired (one with a reversed k-space readout) to correct for susceptibility artefacts. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 326, "expCohort": 1, "expWave": 8, "expType": 7, "expSubject": 0, "expName": 46, "expInfo": "Behavioral output file accompanying emotionmriscan.", "expAdditionalRemarks": null },
  { "expId": 327, "expCohort": 1, "expWave": 8, "expType": 7, "expSubject": 0, "expName": 47, "expInfo": "Functional MRI acquired while subjects performed a task. Participants viewed pictures of faces (happy, fearful, or neutral expression) and houses in a pseudorandom order. The stimuli are taken from the Radboud Faces Database (Langner et al., 2010). Stimuli were presented in blocks of 18 seconds, with four blocks for each of the four stimulus types. The scan sequence: using SENSE coil; parallel imaging, sensefactor 1.8; T2* weighted scan; Timeseries 389 scans, single scan duration 1 sec; Scanorientation sagittal; 64x64 acquisition matrix; 51 slices; multiband factor 3; FOV 220 mm; 2.5 mm isotropic voxels; TR/TE 1000/25. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 328, "expCohort": 1, "expWave": 8, "expType": 7, "expSubject": 0, "expName": 48, "expInfo": "Behavioral output file accompanying inhibitionmriscan.", "expAdditionalRemarks": null },
  { "expId": 329, "expCohort": 1, "expWave": 8, "expType": 7, "expSubject": 0, "expName": 49, "expInfo": "Functional MRI acquired while subjects performed a task. Task aims to measure performance and brain activation during actual stopping as well as during the anticipation of stopping. Trials begin with the presentation of a cue (0, * or **), representing the stop-signal probability (0, 22 and 33% respectively). Permanently visible are three horizontal white lines, and goal is to stop a rising bar as close to the middle line as possible (target) by pressing a button, but refrain from pressing the button when the bar stops on its own (stop signal). The scan sequence: SENSE coil; parallel imaging, sensefactor 1.8; T2* weighted scan; Timeseries 595 scans, single scan duration 1 sec; Scanorientation sagittal; 64x64 acquisition matrix; 51 slices; multiband factor 3; FOV = 220 mm; 2.5 mm isotropic voxels; TR/TE 1000/25. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 330, "expCohort": 1, "expWave": 8, "expType": 7, "expSubject": 0, "expName": 76, "expInfo": "Visual scale to assess how excited and how tensed the child feels during the MRI experiment.", "expAdditionalRemarks": "vasmri recorded in labjournal" },
  { "expId": 331, "expCohort": 1, "expWave": 8, "expType": 7, "expSubject": 0, "expName": 99, "expInfo": "Functional MRI acquired while subjects were presented with a white cross on a grey screen. \nThe scan sequence: using SENSE coil; parallel imaging, sensefactor 1.8; 3D T2* weighted scan; Timeseries 480 scans, single scan duration 1 sec; Scanorientation sagittal; 64x64 acquisition matrix; 51 slices; multiband factor 3; FOV = 220 mm; 2.5 mm isotropic voxels; TR/TE1000/25. Files are in classic DICOM format. ", "expAdditionalRemarks": null },
  { "expId": 332, "expCohort": 1, "expWave": 8, "expType": 9, "expSubject": 2, "expName": 80, "expInfo": "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", "expAdditionalRemarks": "PCI in this cohort stopped in May 2022" },
  { "expId": 333, "expCohort": 1, "expWave": 8, "expType": 9, "expSubject": 2, "expName": 80, "expInfo": "Parent child interaction (PCI) is recorded to allow researchers to code qualitative aspects of the observed interaction between parent and child based on explicitly defined behaviors. The PCI consists of age appropriate structured tasks that include a common mildly stressful event (discussing a difficult topic), and a pleasant event (discussing a pleasant topic). The PCI tasks take about 15 minutes to complete.", "expAdditionalRemarks": "PCI in this cohort stopped in May 2022" },
  { "expId": 334, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 13, "expInfo": "Rothbart's Temperament Questionnaire (EATQ-R) - Subscales: Attention, Inhibitory control", "expAdditionalRemarks": null },
  { "expId": 335, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 19, "expInfo": "Child's report of parental behavior inventory (CRPBI) - subscale Strictness/Supervision", "expAdditionalRemarks": null },
  { "expId": 336, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 20, "expInfo": "Self-Perception Profile for Adolescents (Competentie belevingsschaal - adolescent; CBSA)", "expAdditionalRemarks": null },
  { "expId": 337, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 36, "expInfo": "Eating behavior - developed by Juli\u00ebtte van der Wal, Gerdien Dalmeijer (Whistler) and Charlotte Onland-Moret", "expAdditionalRemarks": null },
  { "expId": 338, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 55, "expInfo": "Brief Barrat impulsivity scale (Brief-BIS) and risk behavior (substance (ab)use)", "expAdditionalRemarks": null },
  { "expId": 339, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 61, "expInfo": "Interpersonal Reactivity Index (IRI) - subscales: Empathic concern (EC), Perspective taking (PT)", "expAdditionalRemarks": null },
  { "expId": 340, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 75, "expInfo": "Use of (computer) games and social media", "expAdditionalRemarks": null },
  { "expId": 341, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 77, "expInfo": "Fictievragenlijst deel 2 kijkgedrag (FVL): Fiction questionnaire - part 2 movies and series", "expAdditionalRemarks": null },
  { "expId": 342, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 78, "expInfo": "Friendship: Network Relationships Inventory Social Provision Version - Short Form (NRI-SPV-SF)", "expAdditionalRemarks": null },
  { "expId": 343, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 81, "expInfo": "Parental control scale (PCS)", "expAdditionalRemarks": null },
  { "expId": 344, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 85, "expInfo": "Parenting Practices (PP)", "expAdditionalRemarks": null },
  { "expId": 345, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 95, "expInfo": "Physical Activity Questionnaire (PAQ-C, PAQ-A)", "expAdditionalRemarks": "only in participants included from 07-04-2018 onwards" },
  { "expId": 346, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 97, "expInfo": "Pubertal development scale (PDS)", "expAdditionalRemarks": null },
  { "expId": 347, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 98, "expInfo": "Fictievragenlijst deel 1 leesgedrag (FVL): Fiction questionnaire - part 1 reading behavior", "expAdditionalRemarks": null },
  { "expId": 348, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 101, "expInfo": "Love, relationships and (online) sexual behavior", "expAdditionalRemarks": null },
  { "expId": 349, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 102, "expInfo": "PROMIS(r) Pediatric Item Bank v1.0 - Sleep practices, Sleep disturbance, Sleep related impairment", "expAdditionalRemarks": null },
  { "expId": 350, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 0, "expName": 105, "expInfo": "Strengths and difficulties questionnaire (SDQ)", "expAdditionalRemarks": null },
  { "expId": 351, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 3, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 352, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 3, "expName": 25, "expInfo": "Utrechtse Coping Lijst (UCL)", "expAdditionalRemarks": null },
  { "expId": 353, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 3, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 12 onwards)", "expAdditionalRemarks": null },
  { "expId": 354, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 3, "expName": 43, "expInfo": "Psychiatric problems of first degree family members", "expAdditionalRemarks": null },
  { "expId": 355, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 3, "expName": 52, "expInfo": "General health questionnaire", "expAdditionalRemarks": null },
  { "expId": 356, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 3, "expName": 68, "expInfo": "Substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 357, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 3, "expName": 71, "expInfo": "List of longterm stressful life events selected by GenerationR", "expAdditionalRemarks": null },
  { "expId": 358, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 3, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 359, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 5, "expName": 1, "expInfo": "Adult Self Report (ASR)", "expAdditionalRemarks": null },
  { "expId": 360, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 5, "expName": 25, "expInfo": "Utrechtse Coping Lijst (UCL)", "expAdditionalRemarks": null },
  { "expId": 361, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 5, "expName": 32, "expInfo": "Household, background, language, education, family relations, economic situation, religion (or updates from wave Rondom 12 onwards)", "expAdditionalRemarks": null },
  { "expId": 362, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 5, "expName": 43, "expInfo": "Psychiatric problems of first degree family members", "expAdditionalRemarks": null },
  { "expId": 363, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 5, "expName": 52, "expInfo": "General health questionnaire", "expAdditionalRemarks": null },
  { "expId": 364, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 5, "expName": 68, "expInfo": "Substance (ab)use", "expAdditionalRemarks": null },
  { "expId": 365, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 5, "expName": 71, "expInfo": "List of longterm stressful life events selected by GenerationR", "expAdditionalRemarks": null },
  { "expId": 366, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 5, "expName": 73, "expInfo": "Major life events in the past 12 months", "expAdditionalRemarks": null },
  { "expId": 367, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 8, "expInfo": "Bullying behavior of/towards the child and Gender Identity (GI)", "expAdditionalRemarks": "GI questions added from 28-03-2018 onwards, previously measured in YAQUEPCADHD" },
  { "expId": 368, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 11, "expInfo": "Quick Big Five (QBF)", "expAdditionalRemarks": null },
  { "expId": 369, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 12, "expInfo": "Child Behavior Checklist (CBCL 6-18 years). Questionnaire about problem behavior and skills of the child", "expAdditionalRemarks": null },
  { "expId": 370, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 13, "expInfo": "Rothbart's Temperament Questionnaire (EATQ-R)", "expAdditionalRemarks": null },
  { "expId": 371, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 16, "expInfo": "Medical questionnaire on child's health", "expAdditionalRemarks": null },
  { "expId": 372, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 65, "expInfo": "Spoken language in child's environment and Clinical Evaluation of Language Fundamentals 4th Edition - subscale Pragmatics (CELF-4-NL-pragmatics)", "expAdditionalRemarks": null },
  { "expId": 373, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 74, "expInfo": "Media education", "expAdditionalRemarks": "only in participants included from 05-04-2018 onwards" },
  { "expId": 374, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 79, "expInfo": "Parent-child relation: Network Relationships Inventory Social Provision Version - Short Form - Parent report (NRI-SPV-SF parent report)", "expAdditionalRemarks": null },
  { "expId": 375, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 84, "expInfo": "Vragenlijst toezicht houden (VTH)/ Parental monitoring questionnaire", "expAdditionalRemarks": null },
  { "expId": 376, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 83, "expInfo": "Nijmeegse Ouderlijke Stress Index (NOSI)/Parental Stress Index (PSI) - subscale Sense of competence", "expAdditionalRemarks": null },
  { "expId": 377, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 86, "expInfo": "Alabamma Parenting Questionnaire (APQ) - Domain: Corporal punishment; Child-Rearing Questionnaire (Nijmeegse Opvoedvragenlijst (NOV)) - Concept: Responsiveness; Parenting Dimensions Inventory (PDI) - Domain: Consistent disciplining", "expAdditionalRemarks": null },
  { "expId": 378, "expCohort": 1, "expWave": 8, "expType": 10, "expSubject": 7, "expName": 105, "expInfo": "Strengths and difficulties questionnaire (SDQ) - Subscales: Prosocial, Peer problems", "expAdditionalRemarks": null },
  { "expId": 379, "expCohort": 0, "expWave": 9, "expType": 10, "expSubject": 5, "expName": 6, "expInfo": "Brief Symptom Inventory (BSI). Questionnaire is taken along with the Crisis Covid questionnaire.", "expAdditionalRemarks": null },
  { "expId": 380, "expCohort": 0, "expWave": 9, "expType": 10, "expSubject": 5, "expName": 27, "expInfo": "Questionnaire taken in apr/may 2020 (round 1)", "expAdditionalRemarks": null },
  { "expId": 381, "expCohort": 0, "expWave": 9, "expType": 10, "expSubject": 5, "expName": 28, "expInfo": "Questionnaire taken in may/jun 2020 (round 2), sep/oct 2022 (round 3), feb/mar 2021 (round 4), dec/jan 2022 (round 5) and jul/aug 2022 (round 6b)", "expAdditionalRemarks": null },
  { "expId": 382, "expCohort": 1, "expWave": 9, "expType": 10, "expSubject": 4, "expName": 6, "expInfo": "Brief Symptom Inventory (BSI). Questionnaire is taken along with the CoRonavIruS health Impact Survey (CRISIS).", "expAdditionalRemarks": null },
  { "expId": 383, "expCohort": 1, "expWave": 9, "expType": 10, "expSubject": 4, "expName": 9, "expInfo": "The CoRonavIruS health Impact Survey (CRISIS) - baseline. Questionnaire taken in apr/may 2020 (round 1)", "expAdditionalRemarks": null },
  { "expId": 384, "expCohort": 1, "expWave": 9, "expType": 10, "expSubject": 4, "expName": 10, "expInfo": "The CoRonavIruS health Impact Survey (CRISIS) - follow-up. Questionnaire taken in may/jun 2020 (round 2), sep/oct 2022 (round 3), feb/mar 2021 (round 4), dec/jan 2022 (round 5) and jul/aug 2022 (round 6b)", "expAdditionalRemarks": null },
  { "expId": 385, "expCohort": 1, "expWave": 9, "expType": 10, "expSubject": 7, "expName": 9, "expInfo": "The CoRonavIruS health Impact Survey (CRISIS) - baseline. Questionnaire taken in apr/may 2020 (round 1)", "expAdditionalRemarks": null },
  { "expId": 386, "expCohort": 1, "expWave": 9, "expType": 10, "expSubject": 7, "expName": 10, "expInfo": "The CoRonavIruS health Impact Survey (CRISIS) - follow-up. Questionnaire taken in may/jun 2020 (round 2), sep/oct 2022 (round 3), feb/mar 2021 (round 4), dec/jan 2022 (round 5) and jul/aug 2022 (round 6b)", "expAdditionalRemarks": null }
];

const nameOptions0 = { 0: "ADHD symptoms and gender identity",
                       1: "Adult Self Report",
                       2: "Ages and Stages Questionnaire - Social Emotional",
                       3: "Anatomy experiment",
                       4: "Antropometrics and vaccinations",
                       5: "Blood",
                       6: "Brief Symptom Inventory",
                       7: "Buccal",
                       8: "Bullying",
                       9: "Characteristics of the child",
                       10: "Child Behavior Checklist",
                       11: "Child Behavior Questionnaire",
                       12: "Child Behavior Questionnaire (CBQB)",
                       13: "Child Behavior Questionnaire (CBQY)",
                       14: "Child Gap antisaccade",
                       15: "Child Gap prosaccade",
                       16: "Child Health",
                       17: "Child health (CHHB)",
                       18: "Childhood trauma questionnaire",
//                     19: "Children's Sleep Habits Questionnaire - Abbreviated",
                       20: "Child Social Gaze",
                       21: "Child's report of parental behavior inventory",
                       22: "Child's sense of compentence",
                       23: "Coherence",
                       24: "Comprehensive Early Childhood Parenting Questionnaire",
                       25: "Coping with situations",
                       26: "Cordblood",
                       27: "Cyberball",
                       28: "Daily care",
                       29: "Delay Gratification",
                       30: "Demographics",
                       31: "Discount (Delay Gratification)",
                       32: "Dti experiment",
                       33: "Eating behavior",
                       34: "Eating behavior (EATP)",
                       35: "Echo",
                       36: "Edinburg Postnatal Depression Scale",
                       37: "Face emotion",
                       38: "Face house",
                       39: "Family illness",
                       40: "Family illness - medical",
                       41: "Family illness - psychiatric",
                       42: "Food Frequency Questionnaire Pregnancy",
                       43: "Food Frequency Questionnaire YOUth",
                       44: "Functional MRI Emotion experiment behaviour",
                       45: "Functional MRI Emotion experiment scan",
                       46: "Functional MRI Inhibition experiment behaviour",
                       47: "Functional MRI Inhibition experiment scan",
//                     48: "Gender identity",
                       49: "General health",
                       50: "Habituation",
                       51: "Hair",
                       52: "Hand Game",
                       53: "Impulsivity and risk behavior",
                       54: "Infant Face Popout",
                       55: "Infant Pro Gap",
                       56: "Infant Social Gaze",
                       57: "Inhibition experiment",
                       58: "Interpersonal Reactivity Index",
                       59: "Labour and Birth",
                       60: "Language development",
                       61: "Language situation",
                       62: "Language situation and pragmatics",
                       63: "Language situation and pragmatics (CLFB)",
                       64: "Leisure time",
                       65: "Length and weight",
                       66: "Lifestyle",
                       67: "Lifestyle during pregnancy",
                       68: "Lifestyle (LSFB)",
                       69: "Lifestyle (LSMA)",
                       70: "Lifestyle (LSMB)",
                       71: "Lifestyle prior to pregnancy",
                       72: "List of longterm stressful life events",
                       73: "Looking While Listening",
                       74: "Major life events",
                       75: "Media education",
                       76: "Media use",
                       77: "Media use (MEDB)",
                       78: "Mock vas score",
                       79: "Mock vas score (MRVA)",
                       80: "Movies and series",
                       81: "Network Relationships Inventory - Short Form",
                       82: "Network Relationships Inventory - Short Form - Parent report",
                       83: "Parental Control Scale ",
                       84: "Parental monitoring questionnaire",
                       85: "Parental Stress Index - Acceptance",
                       86: "Parental Stress Index - Sense of Competence",
                       87: "Parent Child Interaction",
                       88: "Parent Child Interaction (PCIC)",
                       89: "Parent Child Interaction (PCIV)",
                       90: "Parenting behavior",
                       91: "Parenting Practices",
                       92: "Peabody",
                       93: "Peabody (PEAB)",
                       94: "Penn emotion recognition test",
                       95: "Penn motor praxis test",
                       96: "Penn word memory test",
                       97: "Penn word memory test delay",
                       98: "Periconceptual health",
                       99: "Personality: NEO-FFI-3",
                       100: "Physical Activity Questionnaire",
                       101: "Portrait values questionnaire - revised",
                       102: "Pubertal development",
                       103: "Reading behavior",
                       104: "Resting state experiment",
                       105: "Saliva",
                       106: "Sexual development",
                       107: "Sleep behavior",
                       108: "Social Responsiveness Scale for Adults",
                       109: "Social support list",
                       110: "Strengths and difficulties questionnaire",
                       111: "Teacher report form",
                       112: "The Infant-Toddler Social & Emotional Assessment-Revised (ITSEA) ",
                       113: "Trust game",
//                     114: "WAIS",
                       115: "WISC-III",
                       116: "WISC-V",
                       117: "Work" };
//                     118: "WPPSI"
const chrtOptions0 = { 0: 'YOUth Baby and Child',
                       1: 'YOUth Child and Adolescent' };
const waveOptions0 = { 0: '20 weeks pregnancy',
                       1: '30 weeks pregnancy',
                       2: 'Around 0 months',
                       3: 'Around 5 months',
                       4: 'Around 10 months',
                       5: 'Around 3 years',
//                     6: 'Around 6 years',
                       7: 'Around 9 years',
                       8: 'Around 12 years' };
//                     9: 'Around 15 years' };
const typeOptions0 = { 0: 'Biological material',
                       1: 'Body measures',
                       2: 'Computer task',
                       3: 'Echo',
                       4: 'EEG',
                       5: 'Eyetracking',
                       6: 'Intelligence quotient',
                       7: 'Mock scanner',
                       8: 'MRI',
                       9: 'Parent Child Interaction',
                       10: 'Questionnaire',
                       11: 'Video task' };
const subjOptions0 = { 0: 'Child',
                       1: 'Father',
                       2: 'Mother',
                       3: 'Parent/tutor about child',
                       4: 'Partner',
                       5: 'Teacher about child' };

const nameOptions1 = { 0: 'ADHD symptoms and gender identity',
                       1: 'Adult Self Report',
                       2: 'Ages and Stages Questionnaire - Social Emotional',
                       3: 'Anatomy experiment',
                       4: 'Antropometrics and vaccinations',
                       5: 'Blood',
                       6: 'Brief Symptom Inventory',
                       7: 'Buccal',
                       8: 'Bullying',
                       9: 'CRISIS (Baseline)',
                       10: 'CRISIS (Follow-up)',
                       11: 'Characteristics of the child',
                       12: 'Child Behavior Checklist',
                       13: 'Child Behavior Questionnaire',
                       14: 'Child Gap antisaccade',
                       15: 'Child Gap prosaccade',
                       16: 'Child Health',
                       17: 'Child Social Gaze',
                       18: 'Child health',
                       19: "Child's report of parental behavior inventory",
                       20: "Child's sense of compentence",
                       21: 'Childhood trauma questionnaire',
                       22: "Children's Sleep Habits Questionnaire - Abbreviated",
                       23: 'Coherence',
                       24: 'Comprehensive Early Childhood Parenting Questionnaire',
                       25: 'Coping with situations',
                       26: 'Cordblood',
                       27: 'Crisis (Baseline)',
                       28: 'Crisis (Follow-up)',
                       29: 'Cyberball',
                       30: 'Daily care',
                       31: 'Delay Gratification',
                       32: 'Demographics',
                       33: 'Discount (Delay Gratification)',
                       34: 'Dti experiment',
                       35: 'Dual Eyetracking',
                       36: 'Eating behavior',
                       37: 'Echo',
                       38: 'Edinburg Postnatal Depression Scale',
                       39: 'Face emotion',
                       40: 'Face house',
                       41: 'Family illness',
                       42: 'Family illness - medical',
                       43: 'Family illness - psychiatric',
                       44: 'Food Frequency Questionnaire Pregnancy',
                       45: 'Food Frequency Questionnaire YOUth',
                       46: 'Functional MRI Emotion experiment behaviour',
                       47: 'Functional MRI Emotion experiment scan',
                       48: 'Functional MRI Inhibition experiment behaviour',
                       49: 'Functional MRI Inhibition experiment scan',
                       50: 'Functional MRI experiment',
                       51: 'Gender identity',
                       52: 'General health',
                       53: 'Hair',
                       54: 'Hand Game',
                       55: 'Impulsivity and risk behavior',
                       56: 'Infant Face Popout',
                       57: 'Infant Pro Gap',
                       58: 'Infant Social Gaze',
                       59: 'Infant Stop Signal Anticipation Test',
                       60: 'Inhibition experiment',
                       61: 'Interpersonal Reactivity Index',
                       62: 'Labour and Birth',
                       63: 'Language development',
                       64: 'Language situation',
                       65: 'Language situation and pragmatics',
                       66: 'Leisure time',
                       67: 'Length and weight',
                       68: 'Lifestyle',
                       69: 'Lifestyle during pregnancy',
                       70: 'Lifestyle prior to pregnancy',
                       71: 'List of longterm stressful life events',
                       72: 'Looking While Listening',
                       73: 'Major life events',
                       74: 'Media education',
                       75: 'Media use',
                       76: 'Mock vas score',
                       77: 'Movies and series',
                       78: 'Network Relationships Inventory - Short Form',
                       79: 'Network Relationships Inventory - Short Form - Parent report',
                       80: 'Parent Child Interaction',
                       81: 'Parental Control Scale ',
                       82: 'Parental Stress Index - Acceptance',
                       83: 'Parental Stress Index - Sense of Competence',
                       84: 'Parental monitoring questionnaire',
                       85: 'Parenting Practices',
                       86: 'Parenting behavior',
                       87: 'Peabody',
                       88: 'Peabody Picture Vocabulary task',
                       89: 'Penn emotion recognition test',
                       90: 'Penn motor praxis test',
                       91: 'Penn word memory test',
                       92: 'Penn word memory test delay',
                       93: 'Periconceptual health',
                       94: 'Personality: NEO-FFI-3',
                       95: 'Physical Activity Questionnaire',
                       96: 'Portrait values questionnaire - revised',
                       97: 'Pubertal development',
                       98: 'Reading behavior',
                       99: 'Resting state experiment',
                       100: 'Saliva',
                       101: 'Sexual development',
                       102: 'Sleep behavior',
                       103: 'Social Responsiveness Scale for Adults',
                       104: 'Social support list',
                       105: 'Strengths and difficulties questionnaire',
                       106: 'Teacher report form',
                       107: 'The Infant-Toddler Social & Emotional Assessment-Revised (ITSEA) ',
                       108: 'Theory Of Mind scales',
                       109: 'Trust game',
                       110: 'Virtual Reality Balloon analoque risk task Behaviour',
                       111: 'WISC-III',
                       112: 'WISC-V',
                       113: 'WPPSI',
                       114: 'Work' };
const chrtOptions1 = { 0: 'YOUth Baby and Child',
                       1: 'YOUth Child and Adolescent' };
const waveOptions1 = { 0: '20 weeks',
                       1: '30 weeks',
                       2: 'Around 0 months',
                       3: 'Around 5 months',
                       4: 'Around 10 months',
                       5: 'Around 3 years',
                       6: 'Around 6 years',
                       7: 'Around 9 years',
                       8: 'Around 12 years',
                       9: 'Through all waves' };
const typeOptions1 = { 0: 'Biological material',
                       1: 'Body measures',
                       2: 'Computer task',
                       3: 'EEG',
                       4: 'Echo',
                       5: 'Eyetracking',
                       6: 'Intelligence quotient',
                       7: 'MRI',
                       8: 'Mock scanner',
                       9: 'Parent Child Interaction',
                       10: 'Questionnaire',
                       11: 'Registration',
                       12: 'Video task' };
const subjOptions1 = { 0: 'Child',
                       1: 'Child (neonatal MRI)',
                       2: 'Child and Parent',
                       3: 'Father',
                       4: 'Head Educator',
                       5: 'Mother',
                       6: 'Mother (fetal MRI)',
                       7: 'Parent/tutor about child',
                       8: 'Partner',
                       9: 'Teacher about child' };

// Set options matching the most recent data request schema version as the
// default options.
const nameOptions = nameOptions1;
const chrtOptions = chrtOptions1;
const waveOptions = waveOptions1;
const typeOptions = typeOptions1;
const subjOptions = subjOptions1;

const expandRow = {
  showExpandColumn: true,
  renderer: row => (
    <div>
      <p><b>Experiment description:</b> {row.expInfo}</p>
      <p><b>Additional (internal) remarks:</b> {row.expAdditionalRemarks}</p>
    </div>
  )
};

const columns = [
{
  dataField: 'expId',
  text: 'ID'
}, {
  dataField: 'expCohort',
  text: 'Cohort',
  formatter: cell => chrtOptions[cell],
  filter: selectFilter({
    options: chrtOptions
  })
}, {
  dataField: 'expType',
  text: 'Type',
  formatter: cell => typeOptions[cell],
  filter: multiSelectFilter({
    options: typeOptions,
    comparator: Comparator.EQ
  })
}, {
  dataField: 'expName',
  text: 'Name',
  formatter: cell => nameOptions[cell],
  filter: multiSelectFilter({
    options: nameOptions,
    comparator: Comparator.EQ
  })
}, {
  dataField: 'expWave',
  text: 'Wave',
  formatter: cell => waveOptions[cell],
  filter: multiSelectFilter({
    options: waveOptions
  })
}, {
  dataField: 'expSubject',
  text: 'Subject',
  formatter: cell => subjOptions[cell],
  filter: multiSelectFilter({
    options: subjOptions
  })
}
];

const cartColumns0 = [
  {
    dataField: 'expId',
    text: 'ID'
  }, {
    dataField: 'expCohort',
    text: 'Cohort',
    formatter: cell => chrtOptions0[cell]
  }, {
    dataField: 'expType',
    text: 'Type',
    formatter: cell => typeOptions0[cell]
  }, {
    dataField: 'expName',
    text: 'Name',
    formatter: cell => nameOptions0[cell]
  }, {
    dataField: 'expWave',
    text: 'Wave',
    formatter: cell => waveOptions0[cell],
  }, {
    dataField: 'expSubject',
    text: 'Subject',
    formatter: cell => subjOptions0[cell],
  }
];

const cartColumns1 = [
  {
    dataField: 'expId',
    text: 'ID'
  }, {
    dataField: 'expCohort',
    text: 'Cohort',
    formatter: cell => chrtOptions1[cell]
  }, {
    dataField: 'expType',
    text: 'Type',
    formatter: cell => typeOptions1[cell]
  }, {
    dataField: 'expName',
    text: 'Name',
    formatter: cell => nameOptions1[cell]
  }, {
    dataField: 'expWave',
    text: 'Wave',
    formatter: cell => waveOptions1[cell],
  }, {
    dataField: 'expSubject',
    text: 'Subject',
    formatter: cell => subjOptions1[cell],
  }
];

const paginationOptions = {
  sizePerPageList: [{
    text: '10', value: 10
  }, {
    text: '50', value: 50
  }, {
    text: 'All', value: data.length
  }]
}

class DataSelectionCart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...props.formData
    }
  }
  render() {
    // Determine data request schema number
    let schemaIdString = this.props.registry.rootSchema.$id;
    let schemaId;
    // If the data request schema has no $id field, then this signifies that
    // the data request being rendered was generated prior to the versioning of
    // data request schemas (i.e. Yoda 1.7 and earlier) and therefore the data
    // request schema version is "youth-0".  In this case, the "youth-0"
    // version of the YOUth data prospectus should be used to render the
    // shopping cart.
    if (schemaIdString == undefined) {
      schemaId = 0;
    } else {
      let schemaIdExtractor = /https:\/\/yoda.uu.nl\/datarequest\/schemas\/youth-([0-9])\/datarequest\/schema.json/;
      schemaId = Number(schemaIdExtractor.exec(schemaIdString)[1]);
    }

    // Set cartColumns according to schema number
    let cartColumnsPicker = schemaId => {
      if (schemaId == 0) {
        return cartColumns0;
      } else if (schemaId == 1) {
        return cartColumns1;
      } else {
        return null;
      }
    }
    let cartColumns = cartColumnsPicker(schemaId);

    return(
      <div>
        <h2>🛒</h2>
        <BootstrapTable data = { this.state.selectedRows }
                        columns = { cartColumns }
                        expandRow = { expandRow }
                        keyField = 'expId'
                        noDataIndication={ 'No data sets selected yet.' } />
      </div>
    );
  }
}

class DataSelectionTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRows: [],
      ...props.formData
    };
  }

  selectRow = (row, isSelect) => {
    let selectedRows = this.state.selectedRows;
    if (isSelect) {
      selectedRows.push(row);
    } else {
      selectedRows = selectedRows.filter(selectedRows => selectedRows.expId != row.expId);
    }
    this.setState({'selectedRows': selectedRows}, () => this.props.onChange(this.state));
  };

  getSelectedRowIds() {
    let selectedRowIds = [];
    this.state.selectedRows.forEach(function(row, index) {
      selectedRowIds.push(row['expId']);
    });
    return selectedRowIds;
  }

  render() {
    // Hardcode cartColumns to match the most recent version of the data request schemas
    let cartColumns = cartColumns1;
    const selectRow = {
      mode:          "checkbox",
      clickToSelect: true,
      hideSelectAll: true,
      selected:      this.getSelectedRowIds(),
      style:         { backgroundColor: '#c8e6c9' },
      onSelect:      this.selectRow
    };

    const selectRowCart = {
      mode:          "checkbox",
      clickToSelect: true,
      hideSelectAll: true,
      selected:      this.getSelectedRowIds(),
      onSelect:      this.selectRow
    };

    return (
      <div>
        <BootstrapTable ref        = { n => this.node = n }
                        keyField   = 'expId'
                        data       = { data }
                        columns    = { columns }
                        expandRow  = { expandRow }
                        selectRow  = { selectRow }
                        pagination = { paginationFactory(paginationOptions) }
                        filter     = { filterFactory() } />
        <h2>🛒</h2>
        <BootstrapTable data             = { this.state.selectedRows }
                        columns          = { cartColumns }
                        expandRow        = { expandRow }
                        selectRow        = { selectRowCart }
                        keyField         = 'expId'
                        noDataIndication = { 'No data sets selected yet.' } />
      </div>
    );
  }
}

export { DataSelectionTable, DataSelectionCart };
