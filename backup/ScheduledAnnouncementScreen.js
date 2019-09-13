import React, {PropTypes} from 'react'
import {View, Text, ScrollView, TouchableOpacity, TextInput, ListView, RefreshControl, ActivityIndicator, StyleSheet, InteractionManager} from 'react-native'
import {connect} from 'react-redux'
import Actions from '../../../../Actions/Creators'
import {Colors} from '../../../../Themes/'
import {Actions as NavigationActions} from 'react-native-router-flux'
import SendiAPI from '../../../../Services/SendiApi'
import Icon from 'react-native-vector-icons/Ionicons'
import Styles from '../../../Styles/LoginScreenStyle'
import {Globals, Func, Fetch, Storage} from '../../../../Utils/'
import {screenStyle as scr, listStyle as ls} from '../../../Styles/Common/'
import style from './../../../Styles/AnnouncementScreenStyle'
import Avatar from '../../../../Components/Avatar'
import Placeholder from '../../../../Components/Placeholder'
import Announcement from '../../../../Components/Announcement'
import Image from 'react-native-image-progress'
import ActionButton from 'react-native-action-button'

var moment = require('moment')

class ScheduledAnnouncementScreen extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      schoolId: props.auth.schoolId,
			userId: props.auth.userId,
			role: props.auth.role,
			isConnected: props.isConnected,
			
			announcements: Func.listview().cloneWithRows([]),
			rawannouncements: [],
			
			loading: true,
			refreshing: false,
			listviewKey: false
    }
  }
  
  componentDidMount(){
	  InteractionManager.runAfterInteractions(()=>{
		 this.getMyScheduledAnnouncements()
	  })
  }
  
  componentWillReceiveProps(newProps){
	  if(newProps.isUpdateScheduledAnnouncementScreen){
		  this.handleRefresh()
		  this.props.updateScheduledAnnouncementScreen(false)
	  }
	  
	  this.setState({ listviewKey: Math.random(), isConnected: newProps.isConnected })
  }
  
  async getMyScheduledAnnouncements(data){
		 var aDB, data, announcements = []
		 
		 if(typeof data === 'undefined'){
			 aDB = await Storage.doLoad(Globals.db.aDB)
			 data = aDB.data
		 }
				
		if(data.length > 0){

			for(var d in data){
				var obj = data[d],
						appSendOn = obj.appSendOn !== null ? moment(obj.appSendOn).format("YYYY-MM-DD HH:mm:ss") : null
						
				obj.tempAvatarPath = obj.avatarPath
				obj.date = Func.formatDate(obj.appCreatedDate)
				obj.time = Func.formatTime(obj.appCreatedDate)
				obj.sched_date = Func.formatDate(obj.appSendOn)
				obj.sched_time = Func.formatTime(obj.appSendOn)
				
				if(appSendOn != null && moment(appSendOn).isAfter()) announcements.push(obj)
			}
		}
			
	  this.setState({
		  announcements:this.state.announcements.cloneWithRows(announcements),
		  rawannouncements:announcements,
		  loading:false,
		  listviewKey: Math.random()
	  })
  }
  
  handleEditAnnouncement(rd){
	  NavigationActions.editAnnouncement({Announcement:rd})
  }
  
  handleDeleteAnnouncement(rd){
	  Func.ask('Are you sure?\n\n' + 'Subject: ' + rd.title,'Delete Announcement',[
			
			{text:'Yes',onPress: ()=>{ 
			
				this.deleteAnnouncement(rd)
			  
			}},
			
			{text: 'Cancel', style: 'cancel'}
	  ])
	  
  }
  
  async deleteAnnouncement(rd){
	  try{
		  var del = await Fetch.put('Announcement/DeleteAnnouncement?AnnouncementId=' + rd.announcementId),
					announcements = this.state.rawannouncements,
					aDB = await Storage.doLoad(Globals.db.aDB),
					aRes = aDB.data
		  
		  announcements.map((el, index) => {
			  if(el.announcementId === rd.announcementId) announcements.splice(index,1)
		  })
	  
			aRes.map((el, index) => {
			  if(el.announcementId === rd.announcementId) aRes.splice(index,1)
		  })
	  
			Storage.doSave(Globals.db.aDB,{data:aRes})
	  
			this.props.updateAnnouncementScreen(true)
		  
		  this.setState({
			  announcements: this.state.announcements.cloneWithRows(announcements),
			  rawannouncements: announcements,
			  announcementId: rd.announcementId,
			  listviewKey: Math.random()
		  })
	  }
	  catch(err){
		  Func.error('Something went wrong')
	  }
  }
  
  handleRefresh(){
	  var {userId, role, isConnected, rawannouncements} = this.state,
				endpoint = 'Announcement/GetMyScheduledAnnouncement?' + role + 'UserId=' + userId,
				states = {
					announcements:this.state.announcements.cloneWithRows(rawannouncements),
				  rawannouncements:rawannouncements,
				  loading:true
				}	
					
	  if(this.props.isConnected){
		  try{
			  
			  this.setState(states)
			  
				Fetch.get(endpoint).then(data => {
				  this.getMyScheduledAnnouncements(data)
				})
			}
			catch(err){
				states.loading = false
				this.setState(states)
			}
	  }
  }
  
  /*renderAnnouncements(rd){
	  return (
			<Announcement
				data={rd}
				editable={true}
				onEdit={this.handleEditAnnouncement.bind(this,rd)}
				onDelete={this.handleDeleteAnnouncement.bind(this,rd)}
			/>
		)
  }*/
  
  renderAnnouncements(rd){
	  var attachment = rd.attachmentPath,
      is_image = Func.is_image(attachment);

    var img = is_image ? <View style={{marginBottom:10}}>
      <Image source={{uri:Globals.s3 + attachment}} style={{resizeMode:'cover'}} height={200} />
    </View> : null;

    var doc = is_image === false ?
      <TouchableOpacity
        onPress={ ()=> web('http://www.hisendi.com/sendi/m.php/attachment/announcement/' + rd.id)}>
        <View style={[ls.item,{flexDirection:'row',justifyContent:'center'}]}>
          <Text style={{fontSize:10,color:'teal',textAlign:'center',marginRight:5}}>
            To download this attachment, click to open in mobile browser
          </Text>
          <Icon name='ios-arrow-forward' size={14} color='teal' />
		  
        </View>
      </TouchableOpacity> : null
	  
	  var actionBtns = <View style={{flexDirection:'row',width:50}}>
										<TouchableOpacity style={{marginRight:15}} onPress={this.handleEditAnnouncement.bind(this,rd)}>
											<Icon name='ios-create' size={25} />
										</TouchableOpacity>
										
										<TouchableOpacity onPress={this.handleDeleteAnnouncement.bind(this,rd)}>
											<Icon name='ios-close' size={30} />
										</TouchableOpacity>
									 </View>

    return (
      <View style={{marginBottom:10}}>
        <View style={[ls.item,{borderBottomWidth:0}]}>
		
          <View style={ls.body}>
		  
            <View style={ls.left}>
              <Avatar source={rd} size={30} />
            </View>

            <View style={ls.center}>
							<View style={{flexDirection:'row'}}>
								<Text style={[ls.centerPrimary,{flex:1}]}>{rd.title}</Text>
								{this.props.isConnected && actionBtns}
							</View>
							<View style={{flexDirection:'row'}}>
							  <Text style={[ls.centerSecondary,{fontSize:10}]}>{rd.date} at {rd.time}</Text>
							  <Text style={[ls.centerSecondary,{fontSize:10,marginLeft:10}]}>Schedule: {rd.sched_date} at {rd.sched_time}</Text>
							</View>
            </View>
			
          </View>
        </View>

        <View style={[ls.item,{borderBottomColor:'#eee',paddingHorizontal:0}]}>
            {(attachment && attachment != '') && img}
						<View style={{paddingHorizontal:20}}>
							<Text>{rd.body}</Text>
						</View>
        </View>

        {(attachment && attachment != '') && doc}
      </View>
    )
  }

  render() {
	  
	  const { announcements, loading, refreshing, listviewKey } = this.state
	  
	  var actionBtn = <ActionButton
										buttonColor="rgba(231,76,60,1)"
										icon={<Icon name="md-create" style={styles.actionButtonIcon} />}
										onPress={NavigationActions.createAnnouncement}
								  />
		
		var announcementDisplay = announcements.getRowCount() > 0 ? <ListView
																																key={listviewKey}
																															  dataSource={announcements}
																															  renderRow={this.renderAnnouncements.bind(this)}
																															  enableEmptySections={true}
																															/> : <Placeholder kind='announcements' visible={!loading} />
	  
    return (
			<View style={{flex:1}}>
			
				<ActivityIndicator animating={loading} style={{height:0}} />
			
			  <ScrollView
				style={[scr.container,{backgroundColor:'#fff'}]}
				enableEmptySections={true}
				showsVerticalScrollIndicator={false}
				showsHorizontalScrollIndicator={false}
				refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={this.handleRefresh.bind(this)}
							/>
						}
					>
					
						{announcementDisplay}
						
			  </ScrollView>
			  
			  
			  {this.props.isConnected && actionBtn}
			  
			</View>
    )
  }
}

const styles = StyleSheet.create({
  container:{
	  flex:1,
	  backgroundColor:'#f3f3f3'
  },
  actionButtonIcon: {
    fontSize: 20,
    height: 22,
    color: 'white'
  }
})

const mapStateToProps = (state) => {
  return {
    auth: state.login.auth,
		isConnected: state.network.isConnected,
		isUpdateScheduledAnnouncementScreen: state.announcement.isUpdateScheduledAnnouncementScreen
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
	  updateAnnouncementScreen: (updateScreen) => dispatch(Actions.updateAnnouncementScreen(updateScreen)),
	  updateScheduledAnnouncementScreen: (updateScreen) => dispatch(Actions.updateScheduledAnnouncementScreen(updateScreen))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ScheduledAnnouncementScreen)
