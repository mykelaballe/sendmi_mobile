import React, {PropTypes} from 'react'
import {Text, View, StyleSheet, TouchableOpacity, ScrollView, ListView, RefreshControl, ActivityIndicator, Dimensions} from 'react-native'
import {connect} from 'react-redux'
import Actions from '../../../Actions/Creators'
import Icon from 'react-native-vector-icons/Ionicons'
import {Actions as NavigationActions, ActionConst} from 'react-native-router-flux'
import ActionButton from 'react-native-action-button'
import Image from 'react-native-image-progress'
import {Globals, Func, Fetch, Storage} from '../../../Utils/'
import {screenStyle, listStyle as ls} from '../../Styles/Common/'
import style from './../../Styles/AnnouncementScreenStyle'
import indexScreenStyle from './../../Styles/IndexScreenStyle'
import Avatar from '../../../Components/Avatar'
import Placeholder from '../../../Components/Placeholder'
import Announcement from '../../../Components/Announcement'

var moment = require('moment')
var {height, width} = Dimensions.get('window')

class AnnouncementScreen extends React.Component{

  constructor(props){
    super(props)
    this.state = {
			schoolId:props.auth.schoolId,
			userId:props.auth.userId,
			role:props.auth.role,
			isConnected:props.isConnected,
			
			announcements: Func.listview().cloneWithRows([]),
			rawannouncements: [],
			listviewKey: false,
			
			scheduledAnnouncements: Func.listview().cloneWithRows([]),
			rawScheduledAnnouncements: [],
			
			loading: true,
			refreshing:false
		}
  }
  
  componentDidMount(){
	  this.getMyAnnouncements()
  }
  
  componentWillReceiveProps(newProps){
	  
	  if(newProps.isUpdateAnnouncementScreen){
		  this.handleRefresh()
		  this.props.updateAnnouncementScreen(false)
	  }
	  
		this.setState({ listviewKey: Math.random(), isConnected: newProps.isConnected })
  }
  
  async getMyAnnouncements(){
	 var {userId, role, isConnected, listviewKey} = this.state,
				data = [],
				announcements = [],
				scheduled = [],
				endpoint = 'Announcement/GetMyAnnouncement?' + role + 'UserId=' + userId,
				states = {
					announcements:this.state.announcements.cloneWithRows(announcements),
				  rawannouncements:announcements,
				  scheduledAnnouncements:this.state.scheduledAnnouncements.cloneWithRows(scheduled),
				  rawScheduledAnnouncements:scheduled,
				  loading:true,
				  listviewKey:Math.random()
				}
	 
	 if(isConnected){
			try{
				data = await Fetch.get(endpoint)
				Storage.doSave(Globals.db.aDB,{data:data})
			}
			catch(err){
				states.loading = false
				this.setState(states)
			}
	 }
	 else{
		 local = await Storage.doLoad(Globals.db.aDB)
		 data = local.data
	 }
		 
	  if(data.length > 0){
		  
			for(var d in data){
				var obj = data[d],
						appSendOn = obj.appSendOn !== null ? moment(obj.appSendOn).format("YYYY-MM-DD HH:mm:ss") : null
				
				obj.tempAvatarPath = obj.avatarPath
				obj.date = Func.formatDate(obj.appCreatedDate)
				obj.time = Func.formatTime(obj.appCreatedDate)
				
				if(appSendOn == null || moment(appSendOn).isBefore()) announcements.push(obj)
					
				else scheduled.push(obj)
			}
	  }
	  
	  states.announcements = this.state.announcements.cloneWithRows(announcements)
	  states.rawannouncements = announcements
	  states.scheduledAnnouncements = this.state.scheduledAnnouncements.cloneWithRows(scheduled)
	  states.rawScheduledAnnouncements = scheduled
	  states.loading = false
	  
	  this.setState(states)
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
  
  handleViewAnnouncement(announcement){
	  NavigationActions.viewAnnouncement({Announcement:announcement})
  }
  
  handleRefresh(){
	  if(this.props.isConnected) this.getMyAnnouncements()
  }

	renderAnnouncements(rd){
	  return ( <Announcement data={rd} onDelete={this.handleDeleteAnnouncement.bind(this,rd)} /> )
  }
  
  /*renderAnnouncements(rd){
	  var attachment = rd.attachmentPath,
      is_image = Func.is_image(attachment)

		var img_source = {uri:Globals.s3 + attachment}
		
		var img = is_image ? <View style={{marginBottom:10}}>
													<TouchableOpacity>
														<Image source={img_source} style={{resizeMode:'cover'}} height={200} />
													</TouchableOpacity>
												</View> : null

    var doc = is_image === false ?
      <TouchableOpacity
        onPress={ ()=> web('http://www.hisendi.com/sendi/m.php/attachment/announcement/' + rd.announcementId)}>
        <View style={[ls.item,{flexDirection:'row',justifyContent:'center'}]}>
          <Text style={{fontSize:10,color:'teal',textAlign:'center',marginRight:5}}>
            To download this attachment, click to open in mobile browser
          </Text>
          <Icon name='ios-arrow-forward' size={14} color='teal' />
        </View>
      </TouchableOpacity> : null
	  
	  var actionBtn = <TouchableOpacity style={{width:20}} onPress={this.handleDeleteAnnouncement.bind(this,rd)}>
										<Icon name='ios-close' size={30} />
									</TouchableOpacity>

    return (
      <View style={{marginBottom:10}}>
        <View style={[ls.item,{borderBottomWidth:0}]}>
				
				<View style={ls.body}>
            <View style={ls.left}>
              <Avatar source={rd} size={30} />
            </View>

            <View style={ls.center}>
							<View style={{flexDirection:'row'}}>
								<TouchableOpacity style={{flex:1}} onPress={this.handleViewAnnouncement.bind(this,rd)}>
									<Text style={ls.centerPrimary}>{rd.title}</Text>
								</TouchableOpacity>
								{this.props.isConnected && actionBtn}
								
							</View>
              <Text style={[ls.centerSecondary,{fontSize:12}]}>by {rd.firstName} {rd.lastName}</Text>
              <Text style={[ls.centerSecondary,{fontSize:10}]}>{rd.date} at {rd.time}</Text>
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
  }*/
  
  render(){
	  
	const { announcements, rawScheduledAnnouncements, listviewKey, loading, refreshing } = this.state
	  
	var sched = rawScheduledAnnouncements.length > 0 ?
								<TouchableOpacity onPress={NavigationActions.scheduledAnnouncement}>
									<View style={indexScreenStyle.toolbar}>
										<View style={indexScreenStyle.btn}>
											<Text style={indexScreenStyle.btnText}>View Scheduled Announcements</Text>
											<Icon name='ios-arrow-forward' size={25} style={{marginLeft:10}} color='#fff' />
										</View>
									</View>
								</TouchableOpacity>
								: null

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
		
			<View>{ sched }</View>
			
			
				<ActivityIndicator animating={loading} style={{height:0}} />
				
				<ScrollView
				style={[styles.container]}
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
		isUpdateAnnouncementScreen: state.announcement.isUpdateAnnouncementScreen
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
	  updateAnnouncementScreen: (updateScreen) => dispatch(Actions.updateAnnouncementScreen(updateScreen))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AnnouncementScreen)